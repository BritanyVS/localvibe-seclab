import { afterEach, describe, expect, it } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import { SearchNotice } from "../components/SearchNotice";


describe("SearchNotice — prueba funcional", () => {
  afterEach(() => {
    cleanup();
    window.history.pushState({}, "", "/");
  });

  it("muestra el término de búsqueda activo", () => {
    window.history.pushState({}, "", "/?q=cafe%20de%20especialidad");

    render(<SearchNotice />);

    expect(screen.getByText("Búsqueda activa: cafe de especialidad")).toBeDefined();
  });

  it("conserva acentos y espacios del término", () => {
    window.history.pushState({}, "", "/?q=Caf%C3%A9%20Lila");

    render(<SearchNotice />);

    expect(screen.getByText("Búsqueda activa: Café Lila")).toBeDefined();
  });
});
