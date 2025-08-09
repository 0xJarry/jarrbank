"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.appRouter = void 0;
const server_1 = require("@trpc/server");
const portfolio_router_1 = require("./portfolio.router");
const t = server_1.initTRPC.create();
exports.appRouter = t.router({
    portfolio: portfolio_router_1.portfolioRouter
});
//# sourceMappingURL=index.js.map