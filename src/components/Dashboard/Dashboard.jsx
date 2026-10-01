import React, { useEffect, useState } from "react";
import "./Dashboard.css";
import Chart from "../Charts/Chart";
import Boleta from "../Boleta/Boleta";
import LanguageSwitcher from "../LanguageSwitcher/LanguageSwitcher";
import { useTranslation } from "../../i18n";
import {
  cancelOrder as cancelServerOrder,
  getStockBars,
  listOrders,
  submitOrder,
} from "../../api/orders";

const formatCurrency = (value, language) =>
  new Intl.NumberFormat(language, { style: "currency", currency: "USD" }).format(value);

function mapAlpacaOrder(order) {
  const orderPrice = order.limit_price ?? order.filled_avg_price;
  return {
    id: order.id,
    symbol: order.symbol,
    side: order.side,
    quantity: Number(order.qty),
    type: order.type,
    price: orderPrice == null ? null : Number(orderPrice),
    limitPrice: order.limit_price == null ? null : Number(order.limit_price),
    submittedAt: order.submitted_at || order.created_at,
  };
}

function formatOrderTime(value, language) {
  return new Intl.DateTimeFormat(language, {
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

export default function Dashboard() {
  const { language, t } = useTranslation();
  const [marketPrice, setMarketPrice] = useState(null);
  const [bars, setBars] = useState([]);
  const [marketQuote, setMarketQuote] = useState(null);
  const [marketDataState, setMarketDataState] = useState("loading");
  const [orders, setOrders] = useState([]);
  const [ordersState, setOrdersState] = useState("loading");
  const [isCancelling, setIsCancelling] = useState(false);
  const [notice, setNotice] = useState(null);

  useEffect(() => {
    let isCurrent = true;
    Promise.all([listOrders(), getStockBars("AAPL")])
      .then(([ordersData, barsData]) => {
        if (!isCurrent) return;
        setOrders(ordersData.map(mapAlpacaOrder));
        setOrdersState("ready");
        setBars(barsData.bars || []);
        setMarketDataState("ready");
      })
      .catch(() => {
        if (isCurrent) {
          setOrdersState("error");
          setMarketDataState("error");
        }
      });

    const socket = new WebSocket("ws://localhost:3001");

    socket.onmessage = ({ data }) => {
      const event = JSON.parse(data);
      if (event.T === "t" && event.S === "AAPL") {
        setMarketPrice(event.p);
      }
      if (event.T === "b" && event.S === "AAPL") {
        setBars((current) => {
          const existingIndex = current.findIndex((bar) => bar.t === event.t);
          const next = [...current];
          if (existingIndex >= 0) next[existingIndex] = event;
          else next.push(event);
          return next.slice(-60);
        });
        setMarketDataState("ready");
      }
      if (event.T === "q" && event.S === "AAPL") {
        setMarketQuote({
          bidPrice: Number(event.bp),
          bidSize: Number(event.bs),
          askPrice: Number(event.ap),
          askSize: Number(event.as),
        });
      }
    };

    return () => {
      isCurrent = false;
      socket.close();
    };
  }, []);

  async function addOrder({ side, type, quantity, price }) {
    const createdOrder = await submitOrder({
      side,
      type,
      quantity,
      ...(type === "limit" ? { limitPrice: price } : {}),
    });
    setOrders((current) => [mapAlpacaOrder(createdOrder), ...current]);
    setOrdersState("ready");
    setNotice({
      key: "orderSent",
      values: {
        side: t(side === "buy" ? "buyOrder" : "sellOrder").toLowerCase(),
      },
    });
  }

  async function cancelOppositeOrders({ side, type, price, asset }) {
    setIsCancelling(true);
    try {
      const currentOrders = (await listOrders()).map(mapAlpacaOrder);
      const conflicts = currentOrders.filter((order) => {
        if (order.symbol !== asset || order.side === side) return false;
        if (type === "market" || order.type !== "limit" || order.limitPrice == null) {
          return true;
        }
        return side === "sell"
          ? order.limitPrice >= price
          : order.limitPrice <= price;
      });

      if (!conflicts.length) return 0;

      const cancelledIds = [];
      try {
        for (const order of conflicts) {
          await cancelServerOrder(order.id);
          cancelledIds.push(order.id);
        }
      } catch {
        const refreshedOrders = (await listOrders()).map(mapAlpacaOrder);
        setOrders(refreshedOrders);
        throw new Error(t("washTradeCancelPartial"));
      }

      setOrders((current) => current.filter((order) => !cancelledIds.includes(order.id)));
      setNotice({
        key: "opposingOrdersCancelled",
        values: { count: cancelledIds.length },
      });
      return cancelledIds.length;
    } finally {
      setIsCancelling(false);
    }
  }

  const latestBar = bars[bars.length - 1];
  const displayedPrice = marketPrice ?? (latestBar ? Number(latestBar.c) : null);
  const sessionHigh = bars.length
    ? Math.max(...bars.map((bar) => Number(bar.h)))
    : null;
  const sessionLow = bars.length
    ? Math.min(...bars.map((bar) => Number(bar.l)))
    : null;
  const visibleVolume = bars.reduce((total, bar) => total + Number(bar.v || 0), 0);
  const priceChange = latestBar && marketPrice != null
    ? marketPrice - Number(latestBar.o)
    : null;

  async function cancelOrder(id) {
    setIsCancelling(true);
    try {
      await cancelServerOrder(id);
      setOrders((current) => current.filter((order) => order.id !== id));
      setNotice({ key: "orderCancelled", values: { id } });
    } catch (error) {
      setNotice({ text: error.message || t("cancelFailed") });
    } finally {
      setIsCancelling(false);
    }
  }

  async function cancelAllOrders() {
    setIsCancelling(true);
    try {
      await Promise.all(orders.map((order) => cancelServerOrder(order.id)));
      setOrders([]);
      setNotice({ key: "allOrdersCancelled" });
    } catch (error) {
      try {
        const currentOrders = await listOrders();
        setOrders(currentOrders.map(mapAlpacaOrder));
      } catch {
        setOrdersState("error");
      }
      setNotice({ text: error.message || t("cancelFailed") });
    } finally {
      setIsCancelling(false);
    }
  }

  return (
    <main className="dashboard">
      <header className="topbar">
        <div>
          <p className="eyebrow">{t("marketsStocks")}</p>
          <h1>{t("overview")}</h1>
        </div>
        <div className="topbar-tools">
          <LanguageSwitcher />
        </div>
      </header>

      <section className="quote-card card">
        <div className="asset">
          <div className="apple-mark" aria-hidden="true">A</div>
          <div>
            <p className="ticker">{t("appleExchange")}</p>
            <h2>Apple Inc.</h2>
          </div>
        </div>
        <div className="quote-main">
          <strong>{displayedPrice == null ? t("notAvailable") : formatCurrency(displayedPrice, language)}</strong>
          <span className={priceChange != null && priceChange < 0 ? "negative" : "positive"}>
            {priceChange == null
              ? t("waitingForQuote")
              : `${priceChange > 0 ? "+" : ""}${formatCurrency(priceChange, language)} (${(priceChange / Number(latestBar.o) * 100).toFixed(2)}%)`}
          </span>
          <small>{t("iexOneMinuteData")}</small>
        </div>
        <div className="quote-stats">
          <div>
            <span>{t("last60High")}</span>
            <b>{sessionHigh == null ? t("notAvailable") : formatCurrency(sessionHigh, language)}</b>
          </div>
          <div>
            <span>{t("last60Low")}</span>
            <b>{sessionLow == null ? t("notAvailable") : formatCurrency(sessionLow, language)}</b>
          </div>
          <div>
            <span>{t("last60Volume")}</span>
            <b>{new Intl.NumberFormat(language, { notation: "compact", maximumFractionDigits: 1 }).format(visibleVolume)}</b>
          </div>
        </div>
      </section>

      <div className="main-grid">
        <section className="card chart-card">
          <div className="section-heading">
            <div>
              <h2>{t("performance")}</h2>
              <p>{t("stockPriceUsd")}</p>
            </div>
            <span className="chart-interval">{t("oneMinuteBars")}</span>
          </div>
          <div className="market-depth" aria-label={t("topOfBook") }>
            <div className="depth-side buy-depth">
              <span>{t("bestBid")}</span>
              <strong>{marketQuote ? formatCurrency(marketQuote.bidPrice, language) : t("notAvailable")}</strong>
              <small>{marketQuote ? `${new Intl.NumberFormat(language).format(marketQuote.bidSize)} ${t("shares")}` : t("waitingForQuote")}</small>
            </div>
            <div className="depth-pressure" aria-label={t("topBookSize") }>
              <div className="depth-pressure-track">
                <span style={{ width: `${marketQuote && marketQuote.bidSize + marketQuote.askSize > 0 ? marketQuote.bidSize / (marketQuote.bidSize + marketQuote.askSize) * 100 : 50}%` }} />
                <span />
              </div>
              <small>{t("topBookSize")}</small>
            </div>
            <div className="depth-side sell-depth">
              <span>{t("bestAsk")}</span>
              <strong>{marketQuote ? formatCurrency(marketQuote.askPrice, language) : t("notAvailable")}</strong>
              <small>{marketQuote ? `${new Intl.NumberFormat(language).format(marketQuote.askSize)} ${t("shares")}` : t("waitingForQuote")}</small>
            </div>
          </div>
          <Chart
            bars={bars}
            orders={orders.filter((order) => order.symbol === "AAPL" && order.type === "limit" && order.limitPrice != null)}
            isLoading={marketDataState === "loading"}
            isError={marketDataState === "error"}
          />
        </section>
        <Boleta
          assetLabel="AAPL"
          onSubmit={addOrder}
          onCancelOppositeOrders={cancelOppositeOrders}
        />
      </div>

      <section className="card orders-card">
        <div className="section-heading">
          <div>
            <h2>{t("openOrders")}</h2>
            <p>
              {orders.length === 1
                ? t("oneOrderWaiting")
                : t("ordersWaiting", { count: orders.length })}
            </p>
          </div>
          <button
            className="text-button"
            onClick={cancelAllOrders}
            disabled={!orders.length || isCancelling}
          >
            {t("cancelAll")}
          </button>
        </div>
        {notice && (
          <div className="notice" role="status">
            {notice.key ? t(notice.key, notice.values) : notice.text}
          </div>
        )}
        <div className="order-table">
          <div className="table-head">
            <span>{t("order")}</span>
            <span>{t("side")}</span>
            <span>{t("quantityUpper")}</span>
            <span>{t("price")}</span>
            <span>{t("sentAt")}</span>
            <span></span>
          </div>
          {orders.length ? (
            orders.map((order) => (
              <div className="table-row" key={order.id}>
                <strong>{order.id}</strong>
                <span
                  className={`pill ${order.side === "buy" ? "pill-buy" : "pill-sell"}`}
                >
                  {t(order.side === "buy" ? "buyOrder" : "sellOrder")}
                </span>
                <span>{order.quantity} {t("shares")}</span>
                <span>{order.price == null ? t("notAvailable") : formatCurrency(order.price, language)}</span>
                <span>{order.submittedAt ? formatOrderTime(order.submittedAt, language) : t("notAvailable")}</span>
                <button
                  className="cancel-button"
                  onClick={() => cancelOrder(order.id)}
                  disabled={isCancelling}
                >
                  {t("cancel")}
                </button>
              </div>
            ))
          ) : (
            <div className="empty-state">
              {ordersState === "loading"
                ? t("ordersLoading")
                : ordersState === "error"
                  ? t("ordersLoadFailed")
                  : t("noOpenOrders")}
            </div>
          )}
        </div>
      </section>
    </main>
  );
}