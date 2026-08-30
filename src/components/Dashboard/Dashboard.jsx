import React, { useMemo, useState, useEffect } from "react";
import "./Dashboard.css";
import Chart from "../Charts/Chart";
import Boleta from "../Boleta/Boleta";

const formatCurrency = (value) =>
  new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(
    value,
  );
const initialOrders = [
  {
    id: "ORD-1048",
    side: "Compra",
    quantity: 4,
    price: 228.2,
    time: "Hoje, 14:32",
  },
  {
    id: "ORD-1047",
    side: "Venda",
    quantity: 2,
    price: 231.0,
    time: "Hoje, 13:48",
  },
];

export default function Dashboard() {
  const [side, setSide] = useState("Compra");
  const [type, setType] = useState("Limite");
  const [quantity, setQuantity] = useState(1);
  const [price, setPrice] = useState("228.20");
  const [marketPrice, setMarketPrice] = useState(229.45);
  const [orders, setOrders] = useState(initialOrders);
  const [notice, setNotice] = useState("");

  useEffect(() => {
    const socket = new WebSocket("ws://localhost:3001");

    socket.onopen = () => {
      console.log("Conectado ao servidor de cotações.");
    };

    socket.onmessage = ({ data }) => {
      const event = JSON.parse(data);

      console.log("Evento recebido:", event);

      if (event.T === "t" && event.S === "AAPL") {
        setMarketPrice(event.p);
      }
    };

    socket.onclose = (event) => {
      console.warn("Stream desconectado:", event.code, event.reason);
    };

    socket.onerror = (event) => {
      console.error("Erro no WebSocket:", event);
    };

    return () => socket.close();
  }, []);

  const orderValue = useMemo(
    () => Number(quantity || 0) * Number(price || 0),
    [quantity, price],
  );

  function submitOrder(event) {
    event.preventDefault();
    if (!Number(quantity) || !Number(price))
      return setNotice("Informe uma quantidade e pre�o v�lidos.");
    const order = {
      id: `ORD-${1050 + orders.length}`,
      side,
      quantity: Number(quantity),
      price: Number(price),
      time: "Agora mesmo",
    };
    setOrders((current) => [order, ...current]);
    setNotice(`Ordem de ${side.toLowerCase()} enviada com sucesso.`);
  }
  function cancelOrder(id) {
    setOrders((current) => current.filter((order) => order.id !== id));
    setNotice(`Ordem ${id} cancelada.`);
  }

  return (
    <main className="dashboard">
      <header className="topbar">
        <div>
          <p className="eyebrow">MERCADOS / A��ES</p>
          <h1>Vis�o geral</h1>
        </div>
        <div className="market-status">
          <span></span> Mercado aberto <strong>15:42 BRT</strong>
        </div>
      </header>

      <section className="quote-card card">
        <div className="asset">
          <div className="apple-mark">?</div>
          <div>
            <p className="ticker">AAPL � NASDAQ</p>
            <h2>Apple Inc.</h2>
          </div>
        </div>
        <div className="quote-main">
          <strong>{formatCurrency(marketPrice)}</strong>
          <span className="positive">+2.32 (1.02%)</span>
          <small>Dados ilustrativos � 15 min de atraso</small>
        </div>
        <div className="quote-stats">
          <div>
            <span>M�x. hoje</span>
            <b>$230.15</b>
          </div>
          <div>
            <span>M�n. hoje</span>
            <b>$226.66</b>
          </div>
          <div>
            <span>Volume</span>
            <b>42.8M</b>
          </div>
        </div>
      </section>

      <div className="main-grid">
        <section className="card chart-card">
          <div className="section-heading">
            <div>
              <h2>Desempenho</h2>
              <p>Pre�o da a��o em USD</p>
            </div>
            <div className="periods">
              <button>1D</button>
              <button className="selected">1S</button>
              <button>1M</button>
              <button>1A</button>
            </div>
          </div>
          <Chart />
        </section>
        <Boleta
          assetLabel="AAPL"
          onSubmit={({
            side: nextSide,
            type: nextType,
            quantity: nextQuantity,
            price: nextPrice,
          }) => {
            const order = {
              id: `ORD-${1050 + orders.length}`,
              side: nextSide,
              quantity: nextQuantity,
              price: nextPrice,
              time: "Agora mesmo",
            };

            setOrders((current) => [order, ...current]);
            setNotice(
              `Ordem de ${nextSide.toLowerCase()} enviada com sucesso.`,
            );
            setSide(nextSide);
            setType(nextType);
            setQuantity(nextQuantity);
            setPrice(String(nextPrice));
          }}
        />
      </div>

      <section className="card orders-card">
        <div className="section-heading">
          <div>
            <h2>Ordens abertas</h2>
            <p>{orders.length} ordem(ns) aguardando execu��o</p>
          </div>
          <button
            className="text-button"
            onClick={() => setOrders([])}
            disabled={!orders.length}
          >
            Cancelar todas
          </button>
        </div>
        {notice && (
          <div className="notice" role="status">
            {notice}
          </div>
        )}
        <div className="order-table">
          <div className="table-head">
            <span>ORDEM</span>
            <span>TIPO</span>
            <span>QUANTIDADE</span>
            <span>PRE�O-LIMITE</span>
            <span>ENVIADA EM</span>
            <span></span>
          </div>
          {orders.length ? (
            orders.map((order) => (
              <div className="table-row" key={order.id}>
                <strong>{order.id}</strong>
                <span
                  className={`pill ${order.side === "Compra" ? "pill-buy" : "pill-sell"}`}
                >
                  {order.side}
                </span>
                <span>{order.quantity} a��es</span>
                <span>{formatCurrency(order.price)}</span>
                <span>{order.time}</span>
                <button
                  className="cancel-button"
                  onClick={() => cancelOrder(order.id)}
                >
                  Cancelar
                </button>
              </div>
            ))
          ) : (
            <div className="empty-state">Nenhuma ordem aberta.</div>
          )}
        </div>
      </section>
    </main>
  );
}
