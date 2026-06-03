import {
  useNavigate
} from "react-router-dom";

export default function Navbar() {

  const navigate =
    useNavigate();

  const user =
    JSON.parse(
      localStorage.getItem("user")
    );

  const logout = () => {

    localStorage.removeItem(
      "token"
    );

    localStorage.removeItem(
      "user"
    );

    navigate("/login");
  };

  return (

    <div
      className="
      h-16
      border-b
      px-6
      flex
      justify-between
      items-center
      "
    >

      <h1
        className="
        text-xl
        font-semibold
        "
      >
        Leave Management
      </h1>

      <div
        className="
        flex
        gap-4
        items-center
        "
      >

        <span>
          {user?.name}
        </span>

        <button
          onClick={logout}
          className="
          bg-red-500
          text-white
          px-3
          py-1
          rounded
          "
        >
          Logout
        </button>

      </div>

    </div>
  );
}