import { Link } from "react-router-dom";

export default function Login() {
  return (
    <div>
      <div className="flex flex-col items-center justify-center min-h-[80vh]">
        {/* The Card */}
        <div className="w-full max-w-[400px] p-8 bg-zinc-950 border border-zinc-800 rounded-xl shadow-2xl">
          <div className="mb-8 space-y-2 text-center">
            <h2 className="text-2xl font-bold text-zinc-100">Welcome back</h2>
            <p className="text-sm text-zinc-500">
              Enter your credentials to continue
            </p>
          </div>

          <form className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                Email Address
              </label>
              <input
                type="email"
                placeholder="m@example.com"
                className=" text-sm w-full px-3 py-2 bg-zinc-900 border border-zinc-800 rounded-md text-white focus:outline-none focus:ring-1 focus:ring-zinc-500"
              />
              <label className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                Password
              </label>
              <input
                type="password"
                className="text-sm w-full px-3 py-2 bg-zinc-900 border border-zinc-800 rounded-md text-white focus:outline-none focus:ring-1 focus:ring-zinc-500"
              />
            </div>
            <div className="">
              <ul className="flex justify-between">
                <li className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="remember"
                    className="w-4 h-4 bg-zinc-900 border-zinc-800 rounded focus:ring-0 focus:ring-offset-0 accent-zinc-500"
                  />
                  <label
                    htmlFor="remember"
                    className="text-sm text-zinc-500 hover:text-zinc-200 transition duration-300 ease-in-out backdrop-blur-md"
                  >
                    Remember me
                  </label>
                </li>
                <li className="flex items-center gap-2">
                  <Link
                    to="/forgot-password"
                    className="text-sm text-zinc-500 hover:text-zinc-200 transition duration-300 ease-in-out backdrop-blur-md"
                  >
                    Forgot Password?
                  </Link>
                </li>
              </ul>
            </div>
            <button className=" cursor-pointer w-full py-2 bg-zinc-300 text-black rounded-md font-bold hover:bg-zinc-50 transition duration-300 ease-in-out">
              Sign In
            </button>
            <div className="flex justify-center items-center gap-2 border-t border-zinc-800 pt-4">
              <p className="text-sm text-zinc-500">Don't have an account?</p>
              <Link
                to="/register"
                className="text-sm font-medium underline text-slate-400 hover:text-zinc-50 transition duration-300 ease-in-out"
              >
                Sign Up
              </Link>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
