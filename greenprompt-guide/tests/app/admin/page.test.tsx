import { describe, expect, it, vi } from "vitest";
import AdminPage from "@/app/admin/page";

const redirectMock = vi.hoisted(() => vi.fn());

vi.mock("next/navigation", () => ({
  redirect: redirectMock,
}));

describe("Admin page redirect", () => {
  it("redirects to the practices section", () => {
    AdminPage();

    expect(redirectMock).toHaveBeenCalledWith("/admin/practices");
  });
});