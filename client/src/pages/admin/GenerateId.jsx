import { useState } from "react";
import axios from "axios";
import Alert from "../../components/ui/Alert"; // Adjust path if needed

export default function GenerateId() {
  const [formData, setFormData] = useState({
    role: "student",
    name: "",
    email: "",
    expiry_days: 7,
  });
  const [generatedId, setGeneratedId] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const token = localStorage.getItem("token");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setGeneratedId(null);

    try {
      const res = await axios.post(
        (`${process.env.REACT_APP_API_URL || "http://10.201.249.129:5000"}/api/admin/generate-id`),
        formData,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      setGeneratedId(res.data);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to generate ID");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-8 max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold mb-6 text-zinc-900 dark:text-white">
        Admin: Generate Unique ID
      </h1>

      {error && (
        <div className="mb-4">
          <Alert variant="error" title="Error">
            {error}
          </Alert>
        </div>
      )}

      {generatedId && (
        <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg dark:bg-green-900/30 dark:border-green-800">
          <h3 className="font-bold text-green-800 dark:text-green-200">
            ID Generated Successfully!
          </h3>
          <p className="text-xl font-mono mt-2 select-all">
            {generatedId.unique_id}
          </p>
          <div className="mt-2 text-sm text-green-700 dark:text-green-300">
            <p>Role: {generatedId.role}</p>
            {generatedId.bound_to?.name && (
              <p>
                Bound To: {generatedId.bound_to.name} /{" "}
                {generatedId.bound_to.email}
              </p>
            )}
          </div>
        </div>
      )}

      <form
        onSubmit={handleSubmit}
        className="space-y-4 bg-white dark:bg-zinc-900 p-6 rounded-lg border border-zinc-200 dark:border-zinc-800"
      >
        <div>
          <label className="block text-sm font-medium mb-1 text-zinc-900 dark:text-zinc-100">
            Role
          </label>
          <select
            value={formData.role}
            onChange={(e) => setFormData({ ...formData, role: e.target.value })}
            className="w-full p-2 border rounded-md dark:bg-zinc-800 dark:border-zinc-700 font-medium"
          >
            <option value="student">Student</option>
            <option value="teacher">Teacher</option>
            <option value="admin">Admin</option>
          </select>
        </div>

        {formData.role === "teacher" && (
          <div className="p-3 bg-yellow-50 border border-yellow-200 rounded text-sm text-yellow-800 dark:bg-yellow-900/30 dark:border-yellow-800 dark:text-yellow-200">
            Teacher IDs require specific Name and Email binding.
          </div>
        )}

        <div>
          <label className="block text-sm font-medium mb-1 text-zinc-900 dark:text-zinc-100">
            Name (Required for Teacher)
          </label>
          <input
            type="text"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            placeholder="John Doe"
            className="w-full p-2 border rounded-md dark:bg-zinc-800 dark:border-zinc-700"
            required={formData.role === "teacher"}
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1 text-zinc-900 dark:text-zinc-100">
            Email (Required for Teacher)
          </label>
          <input
            type="email"
            value={formData.email}
            onChange={(e) =>
              setFormData({ ...formData, email: e.target.value })
            }
            placeholder="john@example.com"
            className="w-full p-2 border rounded-md dark:bg-zinc-800 dark:border-zinc-700"
            required={formData.role === "teacher"}
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="px-4 py-2 bg-zinc-900 text-white rounded hover:bg-zinc-800 dark:bg-zinc-100 dark:text-black font-bold"
        >
          {loading ? "Generating..." : "Generate ID"}
        </button>
      </form>
    </div>
  );
}

