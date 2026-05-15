/* eslint-disable @typescript-eslint/ban-ts-comment */
// @ts-nocheck
// Planned for the repo's future Vitest + jsdom setup.
import { MemoryRouter, Route, Routes, useLocation } from "react-router-dom";
import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { useAuth } from "../../../contexts/AuthContext";
import { ProtectedRoute } from "./ProtectedRoute";

vi.mock("../../../contexts/AuthContext", () => ({
  useAuth: vi.fn(),
}));

function LoginLocationProbe() {
  const location = useLocation();
  return <div>{`${location.pathname}${location.search}`}</div>;
}

describe("ProtectedRoute", () => {
  it("redirects anonymous users to login with the current path in next", () => {
    vi.mocked(useAuth).mockReturnValue({
      user: null,
      session: null,
      loading: false,
      signInWithMagicLink: vi.fn(),
      signOut: vi.fn(),
    });

    render(
      <MemoryRouter initialEntries={["/studio/projects?tab=recent#images"]}>
        <Routes>
          <Route
            element={
              <ProtectedRoute>
                <div>secret studio</div>
              </ProtectedRoute>
            }
            path="/studio/projects"
          />
          <Route element={<LoginLocationProbe />} path="/login" />
        </Routes>
      </MemoryRouter>,
    );

    expect(screen.getByText("/login?next=%2Fstudio%2Fprojects%3Ftab%3Drecent%23images")).toBeInTheDocument();
    expect(screen.queryByText("secret studio")).not.toBeInTheDocument();
  });
});
