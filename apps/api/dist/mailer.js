import nodemailer from "nodemailer";
export function createTransport(env) {
    const { SMTP_HOST, SMTP_PORT, SMTP_SECURE, SMTP_USER, SMTP_PASS } = env;
    if (!SMTP_HOST || !SMTP_PORT || !SMTP_USER || !SMTP_PASS)
        return null;
    return nodemailer.createTransport({
        host: SMTP_HOST,
        port: SMTP_PORT,
        secure: Boolean(SMTP_SECURE),
        auth: {
            user: SMTP_USER,
            pass: SMTP_PASS,
        },
    });
}
export async function sendBookingEmail(args) {
    const transport = createTransport(args.env);
    if (!transport) {
        return {
            ok: false,
            skipped: true,
            reason: "SMTP ei ole seadistatud. Lisa SMTP_HOST/SMTP_PORT/SMTP_USER/SMTP_PASS .env faili.",
        };
    }
    const { booking, env } = args;
    const machineLabel = booking.machineType === "KRAANAUTO" ? "Kraanaauto" : "Tõstuk (forklift)";
    const subject = `Uus broneering: ${machineLabel} / ${booking.date} (${booking.rentType === "JUHIGA" ? "Juhiga rent" : "Juhita rent"})`;
    const text = [
        "RobiTrans OÜ - uus broneering",
        "",
        `Masin: ${machineLabel}`,
        `Kuupäev: ${booking.date}`,
        `Rent: ${booking.rentType === "JUHIGA" ? "Juhiga" : "Juhita"}`,
        "",
        `Nimi: ${booking.name}`,
        `Email: ${booking.email}`,
        `Telefon: ${booking.phone}`,
        "",
        `Lisa info: ${booking.additionalInfo}`,
    ].join("\n");
    await transport.sendMail({
        from: env.MAIL_FROM,
        to: env.MAIL_TO,
        replyTo: booking.email,
        subject,
        text,
    });
    return { ok: true, skipped: false };
}
