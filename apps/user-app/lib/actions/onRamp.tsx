"use server"
import prisma from "@repo/db/client"
import { getServerSession } from "next-auth"
import { authOptions } from "../../app/lib/auth"

export default async function onRamp(provider: string, amount: number) {
    const session = await getServerSession(authOptions);

    if(!session.user || !session.user?.id) {
        return {
            message: "Unauthorized request"
        }
    }

    const token = (Math.random() * 1000).toString();

    await prisma.onRampTransaction.create({
        data: {
            provider,
            status: "Processing",
            startTime: new Date(),
            token: token,
            userId: Number(session?.user?.id),
            amount: amount * 100
        }
    })
    return {
        message: "done"
    }
}