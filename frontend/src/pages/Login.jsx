import { useState } from "react";
import { useNavigate } from "react-router-dom";

import api from "../services/api";

export default function Login() {

  const navigate =
    useNavigate();

  const [email,setEmail] =
    useState("");

  const [password,setPassword] =
    useState("");

  const [error,setError] =
    useState("");

  const handleSubmit =
    async (e) => {

      e.preventDefault();

      try {

        const response =
          await api.post(
            "/auth/login",
            {
              email,
              password
            }
          );

        localStorage.setItem(
          "token",
          response.data.token
        );

        localStorage.setItem(
          "user",
          JSON.stringify(
            response.data.user
          )
        );

        navigate("/dashboard");

      } catch(error){

        setError(
          error.response?.data?.message
          ||
          "Login failed"
        );

      }
    };

  return (

    <div
      className="
      min-h-screen
      flex
      justify-center
      items-center
      bg-gray-100
      "
    >

      <form
        onSubmit={handleSubmit}
        className="
        bg-white
        p-8
        rounded-lg
        shadow-md
        w-96
        "
      >

        <h1
          className="
          text-2xl
          font-bold
          mb-6
          text-center
          "
        >
          Leave Management
        </h1>

        {error && (
          <p
            className="
            text-red-500
            mb-4
            "
          >
            {error}
          </p>
        )}

        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e)=>
            setEmail(
              e.target.value
            )
          }
          className="
          w-full
          border
          p-2
          mb-4
          "
        />

        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e)=>
            setPassword(
              e.target.value
            )
          }
          className="
          w-full
          border
          p-2
          mb-4
          "
        />

        <button
          type="submit"
          className="
          w-full
          bg-blue-600
          text-white
          p-2
          "
        >
          Login
        </button>

      </form>

    </div>
  );
}