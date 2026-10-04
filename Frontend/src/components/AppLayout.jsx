import { Outlet } from "react-router"
import Navbar from "./Navbar"

const AppLayout = () => (
    <>
        <Navbar />
        <Outlet />
    </>
)

export default AppLayout
