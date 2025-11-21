import app from "./app";

async function startServer() {
    try {
        app.listen(process.env.PORT, () => {
            console.log(`Server is running on port ${process.env.PORT || 3000}`);
        });
    } catch (error) {
        console.error(error);
    }
}

startServer().catch(console.error);