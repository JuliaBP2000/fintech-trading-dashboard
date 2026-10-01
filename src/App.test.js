import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import Auth from "./components/Auth/Auth";
import Boleta from "./components/Boleta/Boleta";
import UserAccountDialog from "./components/Menu/UserAccountDialog";
import { LanguageProvider } from "./i18n";

const originalFetch = global.fetch;

afterEach(() => {
  global.fetch = originalFetch;
  localStorage.removeItem("aurora-language");
});

test("switches the authentication page between Portuguese and English", () => {
  render(
    <LanguageProvider>
      <Auth />
    </LanguageProvider>,
  );

  expect(screen.getByRole("heading", { name: "Bem-vinda de volta" })).toBeInTheDocument();
  fireEvent.click(screen.getByRole("button", { name: "EN" }));

  expect(screen.getByRole("heading", { name: "Welcome back" })).toBeInTheDocument();
  expect(screen.getByRole("button", { name: "Sign in" })).toBeInTheDocument();
});

test("allows login without a name and explains password recovery is unavailable", async () => {
  const user = { id: 7, name: "Julia", email: "julia@example.com" };
  global.fetch = jest.fn().mockResolvedValue({
    ok: true,
    json: async () => ({ user }),
  });

  render(
    <LanguageProvider>
      <Auth />
    </LanguageProvider>,
  );

  fireEvent.change(screen.getByLabelText("E-mail"), {
    target: { value: "julia@example.com" },
  });
  fireEvent.change(screen.getByLabelText("Senha"), {
    target: { value: "password123" },
  });
  fireEvent.click(screen.getByRole("button", { name: "Entrar" }));

  await waitFor(() => expect(global.fetch).toHaveBeenCalledWith(
    "http://localhost:3001/api/auth/login",
    expect.objectContaining({
      method: "POST",
      body: JSON.stringify({ email: "julia@example.com", password: "password123" }),
    }),
  ));
  expect(await screen.findByRole("button", { name: "Esqueci minha senha" })).toBeInTheDocument();
  fireEvent.click(screen.getByRole("button", { name: "Esqueci minha senha" }));
  expect(screen.getByRole("status")).toHaveTextContent("recuperação por e-mail ainda não está configurada");
});

test("offers explicit conflict cancellation without resubmitting the rejected order", async () => {
  localStorage.removeItem("aurora-language");
  const onSubmit = jest.fn().mockRejectedValue(
    new Error("potential wash trade detected. use complex orders"),
  );
  const onCancelOppositeOrders = jest.fn().mockResolvedValue(1);

  render(
    <LanguageProvider>
      <Boleta onSubmit={onSubmit} onCancelOppositeOrders={onCancelOppositeOrders} />
    </LanguageProvider>,
  );

  fireEvent.click(screen.getByRole("button", { name: "Vender" }));
  fireEvent.click(screen.getByRole("button", { name: "Revisar e enviar boleta" }));

  expect(await screen.findByRole("alert")).toHaveTextContent("A Alpaca bloqueou esta ordem");
  fireEvent.click(screen.getByRole("button", { name: "Cancelar ordens opostas pendentes" }));

  await waitFor(() => expect(onCancelOppositeOrders).toHaveBeenCalledWith(
    expect.objectContaining({ side: "sell", asset: "AAPL" }),
  ));
  expect(onSubmit).toHaveBeenCalledTimes(1);
  await waitFor(() => expect(screen.queryByRole("alert")).not.toBeInTheDocument());
});

test("updates the account name and changes the password with the current password", async () => {
  const updatedUser = {
    id: 7,
    name: "Julia Costa",
    email: "julia@example.com",
  };
  const onUpdated = jest.fn();
  global.fetch = jest.fn().mockResolvedValue({
    ok: true,
    json: async () => ({ user: updatedUser }),
  });

  render(
    <LanguageProvider>
      <UserAccountDialog
        user={{ id: 7, name: "Julia", email: "julia@example.com" }}
        onClose={jest.fn()}
        onUpdated={onUpdated}
      />
    </LanguageProvider>,
  );

  fireEvent.change(screen.getByLabelText("Nome"), { target: { value: "Julia Costa" } });
  fireEvent.change(screen.getByLabelText("Senha atual"), { target: { value: "old-password" } });
  fireEvent.change(screen.getByLabelText("Nova senha"), { target: { value: "new-password" } });
  fireEvent.change(screen.getByLabelText("Confirme a nova senha"), { target: { value: "new-password" } });
  fireEvent.click(screen.getByRole("button", { name: "Salvar alterações" }));

  expect(await screen.findByRole("status")).toHaveTextContent("Dados da conta atualizados.");
  expect(global.fetch).toHaveBeenCalledWith(
    "http://localhost:3001/api/auth/profile",
    expect.objectContaining({
      method: "PATCH",
      credentials: "include",
      body: JSON.stringify({
        name: "Julia Costa",
        currentPassword: "old-password",
        newPassword: "new-password",
      }),
    }),
  );
  expect(onUpdated).toHaveBeenCalledWith(updatedUser);
});
