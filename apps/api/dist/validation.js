import { z } from "zod";
export const RentTypeSchema = z.enum(["JUHIGA", "JUHITA"]);
export const CreateBookingSchema = z.object({
    date: z
        .string()
        .regex(/^\d{4}-\d{2}-\d{2}$/, "Kuupäev peab olema formaadis YYYY-MM-DD"),
    name: z.string().min(1, "Nimi on kohustuslik"),
    email: z.string().email("Sisesta korrektne e-mail"),
    phone: z.string().min(3, "Sisesta telefoninumber"),
    rentType: RentTypeSchema,
    additionalInfo: z.string().min(1, "Lisa info on kohustuslik"),
});
export function isWeekend(dateIso) {
    const [y, m, d] = dateIso.split("-").map((x) => Number(x));
    const date = new Date(Date.UTC(y, m - 1, d));
    const day = date.getUTCDay();
    return day === 0 || day === 6;
}
