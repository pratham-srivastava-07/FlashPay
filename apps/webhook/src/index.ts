import express from "express";
import db from "@repo/db/client";
import {z} from "zod"
const app = express();

app.use(express.json())

const paymentBody = z.object({
    token: z.string().nonempty("Token is required"),
    user_identifier: z.string().nonempty("User ID is required"),
    amount: z.string().regex(/^\d+(\.\d{1,2})?$/, "Amount must be a valid number"),
})

app.post("/hdfcWebhook", async (req, res) => {
    //TODO: Add zod validation here?
   const parsedBody = paymentBody.safeParse(req.body);

   if(!parsedBody.success) {
      return res.status(403).json({message: "Wrong credentials"});
   }

   const paymentInformation = {
    token: parsedBody.data.token,
    userId: parsedBody.data.user_identifier,
    amount: parsedBody.data.amount,
};

    try {
        await db.$transaction([
            db.balance.updateMany({
                where: {
                    userId: Number(paymentInformation.userId)
                },
                data: {
                    amount: {
                        
                        increment: Number(paymentInformation.amount)
                    }
                }
            }),
            db.onRampTransaction.updateMany({
                where: {
                    token: paymentInformation.token
                }, 
                data: {
                    status: "Success",
                }
            })
        ]);

        res.json({
            message: "Captured"
        })
    } catch(e) {
        console.error(e);
        res.status(411).json({
            message: "Error while processing webhook"
        })
    }

})

app.listen(3003);