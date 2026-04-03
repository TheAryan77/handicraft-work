import { Request, Response } from "express";
import { asyncHandler } from "../../utils/asyncHandler";
import { sendSuccess } from "../../utils/response";
import { AuthRequest } from "../../middlewares/authenticate";
import {
    placeOrder, getUserOrders, getOrderById,
    cancelOrder, listAllOrders, updateOrderStatus,
} from "./orders.service";

export const place = asyncHandler(async (req: AuthRequest, res: Response) => {
    const { addressId, items, couponCode } = req.body;
    const order = await placeOrder(req.user!.userId, addressId, items, couponCode);
    sendSuccess(res, order, "Order placed successfully", 201);
});

export const myOrders = asyncHandler(async (req: AuthRequest, res: Response) => {
    const result = await getUserOrders(req.user!.userId, req as Request);
    sendSuccess(res, result.orders, "Orders fetched", 200, result.meta);
});

export const getOne = asyncHandler(async (req: AuthRequest, res: Response) => {
    const order = await getOrderById(req.params.id!, req.user!.userId);
    sendSuccess(res, order);
});

export const cancel = asyncHandler(async (req: AuthRequest, res: Response) => {
    const order = await cancelOrder(req.params.id!, req.user!.userId);
    sendSuccess(res, order, "Order cancelled");
});

// Admin
export const allOrders = asyncHandler(async (req: Request, res: Response) => {
    const result = await listAllOrders(req);
    sendSuccess(res, result.orders, "Orders fetched", 200, result.meta);
});

export const updateStatus = asyncHandler(async (req: Request, res: Response) => {
    const order = await updateOrderStatus(req.params.id!, req.body.status);
    sendSuccess(res, order, "Order status updated");
});
