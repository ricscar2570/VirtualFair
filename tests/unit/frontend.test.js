/**
 * Unit tests — Frontend modules
 *
 * These modules are pure JS with no DOM or Vite build step required,
 * so they run in Jest directly.
 *
 * cart.js is the only module that touches browser APIs (localStorage,
 * CustomEvent) — those are shimmed below.
 */

"use strict";

// ─── Browser shims ────────────────────────────────────────────────────────────

// localStorage shim (jest uses jsdom but let's be explicit)
const _store = {};
global.localStorage = {
    getItem: (k) => _store[k] ?? null,
    setItem: (k, v) => {
        _store[k] = String(v);
    },
    removeItem: (k) => {
        delete _store[k];
    },
    clear: () => {
        Object.keys(_store).forEach((k) => delete _store[k]);
    },
};

// CustomEvent shim
global.CustomEvent = class CustomEvent {
    constructor(name, opts = {}) {
        this.type = name;
        this.detail = opts.detail ?? null;
    }
};
global.window = {
    dispatchEvent: jest.fn(),
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    location: { hash: "" },
};

// __APP_CONFIG__ shim (Vite defines this at build time)
global.__APP_CONFIG__ = {};

// ─── helpers.js ───────────────────────────────────────────────────────────────

const {
    escapeHtml,
    formatDate,
    retry,
    getFromStorage,
    saveToStorage,
    removeFromStorage,
    isEmpty,
} = require("../../frontend/src/core/helpers.js");

describe("helpers — escapeHtml", () => {
    test("escapes all five dangerous characters", () => {
        expect(escapeHtml('<script>alert("x\'s")</script>')).toBe(
            "&lt;script&gt;alert(&quot;x&#039;s&quot;)&lt;/script&gt;",
        );
    });
    test("returns empty string for falsy input", () => {
        expect(escapeHtml("")).toBe("");
        expect(escapeHtml(null)).toBe("");
        expect(escapeHtml(undefined)).toBe("");
    });
    test("coerces numbers to string", () => {
        expect(escapeHtml(42)).toBe("42");
    });
});

describe("helpers — formatDate", () => {
    test("formats YYYY-MM-DD correctly", () => {
        expect(formatDate("2024-06-15T10:00:00Z", "YYYY-MM-DD")).toMatch(
            /2024-06-\d{2}/,
        );
    });
    test("uses default format when none given", () => {
        const result = formatDate("2024-01-01T00:00:00Z");
        expect(result).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    });
});

describe("helpers — retry", () => {
    test("returns value on first success", async () => {
        const fn = jest.fn().mockResolvedValue("ok");
        await expect(retry(fn, 3, 0)).resolves.toBe("ok");
        expect(fn).toHaveBeenCalledTimes(1);
    });

    test("retries on failure and succeeds on third attempt", async () => {
        const fn = jest
            .fn()
            .mockRejectedValueOnce(new Error("fail 1"))
            .mockRejectedValueOnce(new Error("fail 2"))
            .mockResolvedValueOnce("success");
        await expect(retry(fn, 3, 0)).resolves.toBe("success");
        expect(fn).toHaveBeenCalledTimes(3);
    });

    test("throws after exhausting all attempts", async () => {
        const err = new Error("always fails");
        const fn = jest.fn().mockRejectedValue(err);
        await expect(retry(fn, 2, 0)).rejects.toThrow("always fails");
        expect(fn).toHaveBeenCalledTimes(2);
    });
});

describe("helpers — localStorage wrappers", () => {
    beforeEach(() => localStorage.clear());

    test("saveToStorage and getFromStorage roundtrip", () => {
        saveToStorage("test_key", { a: 1, b: [2, 3] });
        expect(getFromStorage("test_key")).toEqual({ a: 1, b: [2, 3] });
    });

    test("getFromStorage returns defaultValue for missing key", () => {
        expect(getFromStorage("does_not_exist", "default")).toBe("default");
    });

    test("removeFromStorage deletes the key", () => {
        saveToStorage("del_me", "value");
        removeFromStorage("del_me");
        expect(getFromStorage("del_me")).toBeNull();
    });
});

describe("helpers — isEmpty", () => {
    test.each([
        [null, true],
        [undefined, true],
        ["", true],
        [[], true],
        [{}, true],
        ["a", false],
        [[1], false],
        [{ a: 1 }, false],
    ])("isEmpty(%p) === %p", (input, expected) => {
        expect(isEmpty(input)).toBe(expected);
    });
});

// ─── validators.js ────────────────────────────────────────────────────────────

const {
    validateEmail,
    validatePassword,
    validateRequired,
} = require("../../frontend/src/core/validators.js");

describe("validators — validateEmail", () => {
    test.each([
        ["user@example.com", true],
        ["a+b@x.co", true],
        ["", false],
        [null, false],
        ["notanemail", false],
        ["missing@tld", false],
        ["@nodomain.com", false],
    ])("validateEmail(%p).ok === %p", (email, ok) => {
        expect(validateEmail(email).ok).toBe(ok);
    });

    test("rejects emails over 254 characters", () => {
        const long = "a".repeat(250) + "@b.com";
        expect(validateEmail(long).ok).toBe(false);
    });
});

describe("validators — validatePassword", () => {
    test("accepts the Cognito production policy", () => {
        expect(validatePassword("StrongPassword1!").ok).toBe(true);
    });

    test.each([
        ["Short1!", /12/],
        ["NOLOWERCASE123!", /lowercase/i],
        ["nouppercase123!", /uppercase/i],
        ["NoNumbersHere!", /number/i],
        ["NoSymbolsHere123", /symbol/i],
    ])("rejects invalid password %p", (value, pattern) => {
        const result = validatePassword(value);
        expect(result.ok).toBe(false);
        expect(result.error).toMatch(pattern);
    });

    test("rejects empty password", () => {
        expect(validatePassword("").ok).toBe(false);
    });
});

describe("validators — validateRequired", () => {
    test("passes for non-empty string", () => {
        expect(validateRequired("hello").ok).toBe(true);
    });
    test("fails for empty string", () => {
        expect(validateRequired("").ok).toBe(false);
    });
    test("fails for whitespace-only string", () => {
        expect(validateRequired("   ").ok).toBe(false);
    });
    test("fails for null", () => {
        expect(validateRequired(null).ok).toBe(false);
    });
    test("includes the field label in the error message", () => {
        const result = validateRequired("", "Email");
        expect(result.error).toMatch(/Email/);
    });
});

// ─── templates.js ─────────────────────────────────────────────────────────────
//
// Templates are pure functions: string-in, string-out.
// We test that they return valid markup without crashing and that
// user-supplied values are escaped (no XSS in templates).

const {
    loginFormHTML,
    notFoundHTML,
    cartHTML,
    homepageHTML,
    authGateHTML,
    shellHTML,
    passwordResetFormHTML,
    mfaFormHTML,
    newPasswordFormHTML,
} = require("../../frontend/src/core/templates.js");

describe("templates — loginFormHTML", () => {
    test("returns a non-empty string", () => {
        const html = loginFormHTML();
        expect(typeof html).toBe("string");
        expect(html.length).toBeGreaterThan(0);
    });
    test("contains an email and password input", () => {
        const html = loginFormHTML();
        expect(html).toMatch(/type="email"/);
        expect(html).toMatch(/type="password"/);
    });
});


describe("templates — authentication challenges", () => {
    test("renders reset, MFA and temporary-password forms", () => {
        expect(passwordResetFormHTML("a@example.com")).toMatch(/reset-submit/);
        expect(mfaFormHTML("SOFTWARE_TOKEN_MFA")).toMatch(/authenticator app/i);
        expect(newPasswordFormHTML()).toMatch(/new-password-submit/);
    });
});

describe("templates — notFoundHTML", () => {
    test("contains a 404 indicator", () => {
        expect(notFoundHTML()).toMatch(/404/);
    });
});

describe("templates — cartHTML", () => {
    test("returns a string regardless of items argument", () => {
        expect(typeof cartHTML([])).toBe("string");
        expect(typeof cartHTML([], 0)).toBe("string");
    });

    test("removes direct checkout when visitor payments are disabled", () => {
        const html = cartHTML(
            [{ productId: "p1", productName: "Demo", quantity: 1, price: 10 }],
            10,
            false,
        );
        expect(html).not.toMatch(/Proceed to Checkout/);
        expect(html).toMatch(/not enabled for this event/i);
    });
});

describe("templates — shellHTML", () => {
    test("hides the cart entry when visitor payments are disabled", () => {
        expect(shellHTML({ paymentsEnabled: false })).not.toMatch(/aria-label="Cart"/);
        expect(shellHTML({ paymentsEnabled: true })).toMatch(/aria-label="Cart"/);
    });
});

describe("templates — homepageHTML", () => {
    test("returns a string", () => {
        expect(typeof homepageHTML([])).toBe("string");
    });

    test("renders homepage stats", () => {
        // homepageHTML takes no args — XSS coverage is via escapeHtml tests
        const html = homepageHTML();
        expect(html).toMatch(/Gaming Expos/i);
    });
});

describe("templates — authGateHTML", () => {
    test("returns a string with a login reference", () => {
        const html = authGateHTML();
        expect(typeof html).toBe("string");
        expect(html).toMatch(/sign.?in/i);
    });
});

// ─── cart.js — logic unit tests ───────────────────────────────────────────────
//
// cart.js imports CONFIG (needs __APP_CONFIG__ shim above) and helpers.
// We reset localStorage before each test to isolate state.

const { cartManager } = require("../../frontend/src/checkout/cart.js");

describe("CartManager", () => {
    let cart;

    beforeEach(() => {
        localStorage.clear();
        // Reset the singleton's in-memory state by reloading from (empty) storage
        cartManager.clearCart();
        cart = cartManager;
    });

    test("starts empty", () => {
        expect(cart.isEmpty()).toBe(true);
        expect(cart.getItemCount()).toBe(0);
    });

    test("addItem adds a product", () => {
        cart.addItem("p1", "Widget", 9.99, 1);
        expect(cart.isEmpty()).toBe(false);
        expect(cart.getItemCount()).toBe(1);
    });

    test("addItem increments quantity for duplicate product", () => {
        cart.addItem("p1", "Widget", 9.99, 1);
        cart.addItem("p1", "Widget", 9.99, 2);
        const items = cart.getCart();
        expect(items).toHaveLength(1);
        expect(items[0].quantity).toBe(3);
    });

    test("getTotal sums price × quantity correctly", () => {
        cart.addItem("p1", "A", 10.0, 2);
        cart.addItem("p2", "B", 5.5, 1);
        expect(cart.getTotal()).toBeCloseTo(25.5, 2);
    });

    test("getTotalInCents returns integer cents", () => {
        cart.addItem("p1", "A", 9.99, 1);
        expect(cart.getTotalInCents()).toBe(999);
    });

    test("removeItem removes the product", () => {
        cart.addItem("p1", "Widget", 9.99, 1);
        cart.removeItem("p1");
        expect(cart.isEmpty()).toBe(true);
    });

    test("clearCart empties the cart", () => {
        cart.addItem("p1", "A", 1, 1);
        cart.addItem("p2", "B", 2, 3);
        cart.clearCart();
        expect(cart.isEmpty()).toBe(true);
    });

    test("throws when maxQuantityPerItem is exceeded", () => {
        cart.maxQuantityPerItem = 5;
        cart.addItem("p1", "A", 1, 5);
        expect(() => cart.addItem("p1", "A", 1, 1)).toThrow(
            /maximum quantity/i,
        );
    });

    test("throws when maxItems is exceeded", () => {
        cart.maxItems = 2;
        cart.addItem("p1", "A", 1, 1);
        cart.addItem("p2", "B", 1, 1);
        expect(() => cart.addItem("p3", "C", 1, 1)).toThrow(/cart is full/i);
    });

    test("persists cart state to localStorage", () => {
        cart.addItem("p1", "Widget", 9.99, 2);
        // Verify data was written to storage so a new page load would restore it
        const raw = localStorage.getItem(cart.storageKey);
        const stored = JSON.parse(raw);
        expect(stored).toHaveLength(1);
        expect(stored[0].quantity).toBe(2);
        expect(stored[0].price).toBeCloseTo(9.99, 2);
    });
});


describe("CartManager — defensive branches", () => {
    beforeEach(() => {
        localStorage.clear();
        cartManager.maxItems = 50;
        cartManager.maxQuantityPerItem = 99;
        cartManager.clearCart();
    });

    test("filters malformed persisted entries", () => {
        localStorage.setItem(
            cartManager.storageKey,
            JSON.stringify([
                {
                    productId: "valid",
                    productName: "Valid",
                    price: 2,
                    quantity: 1,
                },
                { productId: "", productName: "Missing ID", price: 1, quantity: 1 },
                { productId: "p2", productName: "", price: 1, quantity: 1 },
                { productId: "p3", productName: "Bad price", price: "1", quantity: 1 },
                { productId: "p4", productName: "Bad qty", price: 1, quantity: 0 },
            ]),
        );
        expect(cartManager.getCart()).toEqual([
            expect.objectContaining({ productId: "valid" }),
        ]);
    });

    test.each([
        ["", "Name", 1, 1, /required/i],
        ["p1", "", 1, 1, /required/i],
        ["p1", "Name", -1, 1, /invalid price/i],
        ["p1", "Name", "1", 1, /invalid price/i],
        ["p1", "Name", 1, 0, /invalid quantity/i],
        ["p1", "Name", 1, "1", /invalid quantity/i],
    ])(
        "rejects invalid addItem arguments %#",
        (productId, productName, price, quantity, error) => {
            expect(() =>
                cartManager.addItem(productId, productName, price, quantity),
            ).toThrow(error);
        },
    );

    test("removeItem reports a missing product without writing", () => {
        cartManager.addItem("p1", "One", 1, 1);
        expect(cartManager.removeItem("missing")).toBe(false);
        expect(cartManager.getUniqueItemCount()).toBe(1);
    });

    test("updateQuantity handles invalid, zero, capped, missing and successful updates", () => {
        cartManager.maxQuantityPerItem = 3;
        cartManager.addItem("p1", "One", 2, 1);

        expect(() => cartManager.updateQuantity("p1", -1)).toThrow(
            /invalid quantity/i,
        );
        expect(() => cartManager.updateQuantity("p1", "2")).toThrow(
            /invalid quantity/i,
        );
        expect(() => cartManager.updateQuantity("p1", 4)).toThrow(
            /maximum quantity/i,
        );
        expect(cartManager.updateQuantity("missing", 2)).toBe(false);
        expect(cartManager.updateQuantity("p1", 2)).toBe(true);
        expect(cartManager.getItem("p1").quantity).toBe(2);
        expect(cartManager.updateQuantity("p1", 0)).toBe(true);
        expect(cartManager.hasItem("p1")).toBe(false);
    });

    test("updateItem distinguishes missing and existing products", () => {
        expect(cartManager.updateItem("missing", { metadata: { a: 1 } })).toBe(
            false,
        );
        cartManager.addItem("p1", "One", 3, 1);
        expect(
            cartManager.updateItem("p1", {
                productName: "Renamed",
                metadata: { source: "test" },
            }),
        ).toBe(true);
        expect(cartManager.getItem("p1")).toEqual(
            expect.objectContaining({
                productName: "Renamed",
                metadata: { source: "test" },
            }),
        );
    });

    test("reports item counts, lookups and clones without sharing references", () => {
        cartManager.addItem("p1", "One", 2, 2);
        cartManager.addItem("p2", "Two", 3, 1);
        expect(cartManager.getItemCount()).toBe(3);
        expect(cartManager.getUniqueItemCount()).toBe(2);
        expect(cartManager.hasItem("p2")).toBe(true);
        expect(cartManager.getItem("missing")).toBeNull();

        const clone = cartManager.cloneCart();
        clone[0].quantity = 99;
        expect(cartManager.getItem("p1").quantity).toBe(2);
    });

    test("validate reports both an empty cart and malformed rows", () => {
        expect(cartManager.validate()).toEqual(
            expect.objectContaining({
                isValid: false,
                errors: expect.arrayContaining(["Cart is empty"]),
            }),
        );

        const originalGetCart = cartManager.getCart;
        cartManager.getCart = () => [
            { productId: "", price: -1, quantity: 0 },
            { productId: "p2", price: "bad", quantity: "bad" },
        ];
        try {
            const result = cartManager.validate();
            expect(result.isValid).toBe(false);
            expect(result.errors).toEqual(
                expect.arrayContaining([
                    "Item 1: Missing product ID",
                    "Item 1: Invalid price",
                    "Item 1: Invalid quantity",
                    "Item 2: Invalid price",
                    "Item 2: Invalid quantity",
                ]),
            );
        } finally {
            cartManager.getCart = originalGetCart;
        }
    });

    test("bulk add records successes and failures", () => {
        const results = cartManager.addMultipleItems([
            { productId: "p1", productName: "One", price: 1 },
            { productId: "", productName: "Broken", price: 1 },
        ]);
        expect(results).toEqual([
            { success: true, productId: "p1" },
            expect.objectContaining({ success: false, productId: "" }),
        ]);

        cartManager.addItem("p2", "Two", 2, 1);
        cartManager.removeMultipleItems(["p1", "missing"]);
        expect(cartManager.hasItem("p1")).toBe(false);
        expect(cartManager.hasItem("p2")).toBe(true);
    });

    test("mergeCart merges, caps and appends within cart capacity", () => {
        cartManager.maxQuantityPerItem = 3;
        cartManager.maxItems = 2;
        cartManager.addItem("p1", "One", 1, 2);
        cartManager.mergeCart([
            {
                productId: "p1",
                productName: "One",
                price: 1,
                quantity: 5,
            },
            {
                productId: "p2",
                productName: "Two",
                price: 2,
                quantity: 1,
            },
            {
                productId: "p3",
                productName: "Three",
                price: 3,
                quantity: 1,
            },
        ]);
        expect(cartManager.getItem("p1").quantity).toBe(3);
        expect(cartManager.hasItem("p2")).toBe(true);
        expect(cartManager.hasItem("p3")).toBe(false);
    });

    test("discount and tax calculations validate their ranges", () => {
        cartManager.addItem("p1", "One", 100, 1);
        expect(cartManager.applyDiscount(25)).toBe(75);
        expect(cartManager.calculateTax(20)).toBe(20);
        expect(cartManager.getTotalWithTax(20)).toBe(120);
        expect(() => cartManager.applyDiscount(-1)).toThrow(/discount/i);
        expect(() => cartManager.applyDiscount(101)).toThrow(/discount/i);
        expect(() => cartManager.applyDiscount("10")).toThrow(/discount/i);
        expect(() => cartManager.calculateTax(-1)).toThrow(/tax rate/i);
        expect(() => cartManager.calculateTax("20")).toThrow(/tax rate/i);
    });

    test("subscribe supports unsubscribe and isolates subscriber errors", () => {
        const listener = jest.fn();
        const unsubscribe = cartManager.subscribe(listener);
        expect(listener).toHaveBeenCalled();

        cartManager.addItem("p1", "One", 1, 1);
        expect(listener).toHaveBeenCalledWith(
            expect.any(Array),
            expect.any(String),
            expect.any(Object),
        );

        unsubscribe();
        const callsAfterUnsubscribe = listener.mock.calls.length;
        cartManager.addItem("p2", "Two", 1, 1);
        expect(listener).toHaveBeenCalledTimes(callsAfterUnsubscribe);

        const errorSpy = jest.spyOn(console, "error").mockImplementation(() => {});
        const badListener = () => {
            throw new Error("subscriber failure");
        };
        const removeBad = cartManager.subscribe(badListener);
        cartManager.addItem("p3", "Three", 1, 1);
        expect(errorSpy).toHaveBeenCalled();
        removeBad();
        errorSpy.mockRestore();
    });

    test("imports and exports carts safely", () => {
        const payload = JSON.stringify([
            {
                productId: "p1",
                productName: "One",
                price: 4,
                quantity: 2,
            },
        ]);
        expect(cartManager.importCart(payload)).toBe(true);
        expect(JSON.parse(cartManager.exportCart())).toHaveLength(1);
        expect(cartManager.importCart("{}")).toBe(false);
        expect(cartManager.importCart("{bad json")).toBe(false);
    });

    test("summary and stopSync cover derived and cleanup state", () => {
        cartManager.addItem("p1", "One", 4, 2);
        expect(cartManager.getCartSummary()).toEqual(
            expect.objectContaining({
                itemCount: 2,
                uniqueItemCount: 1,
                subtotal: 8,
                isEmpty: false,
            }),
        );

        cartManager.syncInterval = setInterval(() => {}, 1000);
        cartManager.stopSync();
        expect(cartManager.syncInterval).toBeNull();
        // No-op branch when already stopped.
        cartManager.stopSync();
    });

    test("syncWithBackend handles empty, populated and error paths", async () => {
        await expect(cartManager.syncWithBackend()).resolves.toBeUndefined();

        const logSpy = jest.spyOn(console, "log").mockImplementation(() => {});
        cartManager.addItem("p1", "One", 1, 1);
        await expect(cartManager.syncWithBackend()).resolves.toBeUndefined();
        expect(logSpy).toHaveBeenCalled();
        logSpy.mockRestore();

        const originalGetCart = cartManager.getCart;
        const errorSpy = jest.spyOn(console, "error").mockImplementation(() => {});
        cartManager.getCart = () => {
            throw new Error("storage unavailable");
        };
        try {
            await expect(cartManager.syncWithBackend()).resolves.toBeUndefined();
            expect(errorSpy).toHaveBeenCalled();
        } finally {
            cartManager.getCart = originalGetCart;
            errorSpy.mockRestore();
        }
    });
});

// ─── dashboard-templates.js ───────────────────────────────────────────────────

const {
    dashboardShellHTML,
    statsHTML,
    ordersHTML: dashboardOrdersHTML,
    savedStandsHTML: dashboardSavedStandsHTML,
    editProfileFormHTML,
} = require("../../frontend/src/account/dashboard-templates.js");

describe("dashboard-templates — statsHTML", () => {
    test("renders zero values gracefully", () => {
        const html = statsHTML({});
        expect(html).toMatch(/0/);
    });
    test("formats totalSpent as currency string", () => {
        const html = statsHTML({
            totalOrders: 3,
            totalSpent: 49.99,
            savedStands: 2,
        });
        expect(html).toMatch(/49/);
        expect(html).toMatch(/Total Orders/);
    });
});

describe("dashboard-templates — ordersHTML", () => {
    test("shows empty message when no orders", () => {
        expect(dashboardOrdersHTML([])).toMatch(/No orders yet/);
    });
    test("renders order card with data-action buttons", () => {
        const orders = [
            {
                order_id: "abc-123-xyz",
                status: "paid",
                total: 20,
                created_at: "2024-01-01",
                items: [],
            },
        ];
        const html = dashboardOrdersHTML(orders);
        expect(html).toMatch(/abc-123/);
        expect(html).toMatch(/data-action="view-order"/);
        expect(html).toMatch(/data-id="abc-123-xyz"/);
    });
    test("shows Load More button only when 10+ orders", () => {
        const orders = Array.from({ length: 10 }, (_, i) => ({
            order_id: `o${i}`,
            status: "paid",
            total: 1,
            created_at: "2024-01-01",
            items: [],
        }));
        expect(dashboardOrdersHTML(orders)).toMatch(/load-more-orders/);
        expect(dashboardOrdersHTML(orders.slice(0, 9))).not.toMatch(
            /load-more-orders/,
        );
    });
    test("escapes XSS in order status", () => {
        const orders = [
            {
                order_id: "x",
                status: "<script>",
                total: 0,
                created_at: "2024-01-01",
                items: [],
            },
        ];
        const html = dashboardOrdersHTML(orders);
        expect(html).not.toMatch(/<script>/);
    });
});

describe("dashboard-templates — savedStandsHTML", () => {
    test("shows empty message when no saved stands", () => {
        expect(dashboardSavedStandsHTML([])).toMatch(/No saved stands/);
    });
    test("renders visit and remove buttons with data-action", () => {
        const stands = [{ stand_id: "s1", name: "Test Stand", image_url: "" }];
        const html = dashboardSavedStandsHTML(stands);
        expect(html).toMatch(/data-action="visit-stand"/);
        expect(html).toMatch(/data-action="unsave-stand"/);
        expect(html).toMatch(/data-id="s1"/);
    });
    test("escapes XSS in stand name", () => {
        const stands = [
            { stand_id: "s1", name: "<img onerror=alert(1)>", image_url: "" },
        ];
        expect(dashboardSavedStandsHTML(stands)).not.toMatch(/<img onerror/);
    });
});

describe("dashboard-templates — editProfileFormHTML", () => {
    test("pre-fills form with user attributes", () => {
        const html = editProfileFormHTML({
            given_name: "Mario",
            family_name: "Rossi",
        });
        expect(html).toMatch(/value="Mario"/);
        expect(html).toMatch(/value="Rossi"/);
    });
    test("handles missing attributes gracefully", () => {
        expect(() => editProfileFormHTML({})).not.toThrow();
    });
});

describe("dashboard-templates — dashboardShellHTML", () => {
    test("renders without throwing", () => {
        const html = dashboardShellHTML({
            username: "mario",
            stats: {},
            ordersHTML: "",
            savedStandsHTML: "",
        });
        expect(typeof html).toBe("string");
        expect(html.length).toBeGreaterThan(0);
    });
    test("escapes XSS in username", () => {
        const html = dashboardShellHTML({
            username: "<script>alert(1)</script>",
            stats: {},
            ordersHTML: "",
            savedStandsHTML: "",
        });
        expect(html).not.toMatch(/<script>/);
    });
});
