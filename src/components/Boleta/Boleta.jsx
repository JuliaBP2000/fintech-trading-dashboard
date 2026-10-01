import React, { useMemo, useState } from "react";
import "./Boleta.css";
import { useTranslation } from "../../i18n";

const formatCurrency = (value, language) =>
  new Intl.NumberFormat(language, { style: "currency", currency: "USD" }).format(value);

export default function Boleta({
  initialSide = "buy",
  assetLabel = "AAPL",
  onSubmit,
  onCancelOppositeOrders,
}) {
  const { language, t } = useTranslation();
  const [side, setSide] = useState(initialSide);
  const [type, setType] = useState("limit");
  const [quantity, setQuantity] = useState(1);
  const [price, setPrice] = useState("228.20");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isResolvingWashTrade, setIsResolvingWashTrade] = useState(false);
  const [isWashTrade, setIsWashTrade] = useState(false);
  const [error, setError] = useState("");

  const orderValue = useMemo(
    () => Number(quantity || 0) * Number(price || 0),
    [quantity, price],
  );

  async function handleSubmit(event) {
    event.preventDefault();

    if (!Number(quantity) || (type === "limit" && !Number(price))) {
      return;
    }

    setError("");
    setIsSubmitting(true);
    try {
      await onSubmit?.({
        side,
        type,
        quantity: Number(quantity),
        price: Number(price),
        total: orderValue,
        asset: assetLabel,
      });
    } catch (submitError) {
      if (/wash trade/i.test(submitError.message)) {
        setIsWashTrade(true);
        setError(t("washTradeDetected"));
        return;
      }
      setError(submitError.message || t("orderFailed"));
    } finally {
      setIsSubmitting(false);
    }
  }

  async function cancelOppositeOrders() {
    setIsResolvingWashTrade(true);
    try {
      const cancelledCount = await onCancelOppositeOrders?.({
        side,
        type,
        quantity: Number(quantity),
        price: Number(price),
        asset: assetLabel,
      });
      setIsWashTrade(false);
      setError(cancelledCount ? "" : t("washTradeNoConflicts"));
    } catch (resolveError) {
      setIsWashTrade(false);
      setError(resolveError.message || t("cancelFailed"));
    } finally {
      setIsResolvingWashTrade(false);
    }
  }

  function clearError() {
    setError("");
    setIsWashTrade(false);
  }

  return (
    <section className="card order-card boleta-card">
      <div className="section-heading">
        <div>
          <h2>{t("newOrder")}</h2>
          <p>{t("sendOrderFor", { asset: assetLabel })}</p>
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="segmented">
          <button
            type="button"
            onClick={() => {
              setSide("buy");
              clearError();
            }}
            className={side === "buy" ? "buy active" : ""}
          >
            {t("buy")}
          </button>
          <button
            type="button"
            onClick={() => {
              setSide("sell");
              clearError();
            }}
            className={side === "sell" ? "sell active" : ""}
          >
            {t("sell")}
          </button>
        </div>

        <label>
          {t("orderType")}
          <select
            value={type}
            onChange={(event) => {
              setType(event.target.value);
              clearError();
            }}
          >
            <option value="limit">{t("limit")}</option>
            <option value="market">{t("market")}</option>
          </select>
        </label>

        <div className="input-row">
          <label>
            {t("quantity")}
            <input
              type="number"
              min="1"
              value={quantity}
              onChange={(event) => {
                setQuantity(event.target.value);
                clearError();
              }}
            />
          </label>

          <label>
            {t("priceUsd")}
            <input
              type="number"
              step="0.01"
              min="0.01"
              value={price}
              onChange={(event) => {
                setPrice(event.target.value);
                clearError();
              }}
            />
          </label>
        </div>

        <div className="order-total">
          <span>{t("estimatedValue")}</span>
          <strong>{formatCurrency(orderValue, language)}</strong>
        </div>

        {error && <p className="boleta-error" role="alert">{error}</p>}
        {isWashTrade && onCancelOppositeOrders && (
          <button
            className="resolve-wash-trade"
            type="button"
            onClick={cancelOppositeOrders}
            disabled={isResolvingWashTrade}
          >
            {isResolvingWashTrade ? t("cancellingOrders") : t("cancelOppositeOrders")}
          </button>
        )}
        <button
          className={`submit-order ${side === "sell" ? "sell-order" : ""}`}
          type="submit"
          disabled={isSubmitting}
        >
          {isSubmitting ? t("sendingOrder") : t("reviewSend")}
        </button>
      </form>
    </section>
  );
}
