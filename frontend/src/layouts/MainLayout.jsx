import Sidebar from "../components/Sidebar";
import Navbar from "../components/Navbar";
import DynamicPageTitle from "../components/PageTitle";

export default function MainLayout({ children }) {
  return (
    <>
      <DynamicPageTitle />   {/* 👈 Add this line */}
      <div className="flex h-screen overflow-hidden">
        <Sidebar />
        <div className="flex-1 flex flex-col overflow-hidden">
          <Navbar />
          <main className="flex-1 overflow-y-auto p-6">
            {children}
          </main>
        </div>
      </div>
    </>
  );
}