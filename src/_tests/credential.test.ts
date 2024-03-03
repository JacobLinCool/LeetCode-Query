import { describe, expect, it } from "vitest";
import { Credential } from "../credential";

describe("Credential", () => {
    it("should be able to pass session and csrf directly", async () => {
        const credential = new Credential({
            session: "test_session",
            csrf: "test_csrf",
        });
        expect(credential.csrf).toBe("test_csrf");
        expect(credential.session).toBe("test_session");
    });

    it("should be able to init without session", async () => {
        const credential = new Credential();
        await credential.init();
        expect(credential.csrf).toBeDefined();
        expect(credential.session).toBeUndefined();
    });

    it("should be able to init with session", async () => {
        const credential = new Credential();
        await credential.init("test_session");
        expect(credential.csrf).toBeDefined();
        expect(credential.session).toBe("test_session");
    });
});
