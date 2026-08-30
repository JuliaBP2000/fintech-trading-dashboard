import React, { useMemo, useState } from "react";
import "./Boleta.css";

const formatCurrency = (value) =>
  new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(
    value,
  );

export default function Boleta({
  initialSide = "Compra",
  assetLabel = "AAPL",
  onSubmit,
}) {
  const [side, setSide] = useState(initialSide);
  const [type, setType] = useState("Limite");
  const [quantity, setQuantity] = useState(1);
  const [price, setPrice] = useState("228.20");

  const orderValue = useMemo(
    () => Number(quantity || 0) * Number(price || 0),
    [quantity, price],
  );

  function handleSubmit(event) {
    event.preventDefault();

    if (!Number(quantity) || !Number(price)) {
      return;
    }

    onSubmit?.({
      side,
      type,
      quantity: Number(quantity),
      price: Number(price),
      total: orderValue,
      asset: assetLabel,
    });
  }

  return (
    <section className="card order-card boleta-card">
      <div className="section-heading">
        <div>
          <h2>Nova ordem</h2>
          <p>Envie uma boleta para {assetLabel}</p>
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="segmented">
          <button
            type="button"
            onClick={() => setSide("Compra")}
            className={side === "Compra" ? "buy active" : ""}
          >
            Comprar
          </button>
          <button
            type="button"
            onClick={() => setSide("Venda")}
            className={side === "Venda" ? "sell active" : ""}
          >
            Vender
          </button>
        </div>

        <label>
          Boleta
          <select
            value={type}
            onChange={(event) => setType(event.target.value)}
          >
            <option>Limite</option>
            <option>Mercado</option>
          </select>
        </label>

        <div className="input-row">
          <label>
            Quantidade
            <input
              type="number"
              min="1"
              value={quantity}
              onChange={(event) => setQuantity(event.target.value)}
            />
          </label>

          <label>
            Preço (USD)
            <input
              type="number"
              step="0.01"
              min="0.01"
              value={price}
              onChange={(event) => setPrice(event.target.value)}
            />
          </label>
        </div>

        <div className="order-total">
          <span>Valor estimado</span>
          <strong>{formatCurrency(orderValue)}</strong>
        </div>

        <button
          className={`submit-order ${side === "Venda" ? "sell-order" : ""}`}
          type="submit"
        >
          Revisar e enviar boleta
        </button>
      </form>
    </section>
  );
}
