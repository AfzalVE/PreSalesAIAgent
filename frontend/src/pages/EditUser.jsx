import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { ArrowLeft, Save } from "lucide-react";

export default function EditUser() {
  const navigate = useNavigate();
  const location = useLocation();

  const user = location.state || {
    name: "",
    email: "",
    phone: "",
    company: "",
    role: "Admin",
    status: "Active",
  };

  const [formData, setFormData] = useState(user);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSave = () => {
    alert("User Updated Successfully");

    // Later API Call
    // axios.put(...)

    navigate(-1);
  };

  return (
    <div className="min-h-screen bg-gray-100">

      <div className="bg-white shadow px-8 py-5 flex justify-between items-center">

        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-blue-600"
        >
          <ArrowLeft size={20} />
          Back
        </button>

        <h1 className="text-3xl font-bold">
          Edit User
        </h1>

      </div>

      <div className="max-w-3xl mx-auto mt-10 bg-white rounded-xl shadow p-8">

        <div className="grid grid-cols-2 gap-5">

          <div>

            <label className="font-semibold">
              Full Name
            </label>

            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              className="w-full mt-2 border rounded-lg p-3"
            />

          </div>

          <div>

            <label className="font-semibold">
              Email
            </label>

            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              className="w-full mt-2 border rounded-lg p-3"
            />

          </div>

          <div>

            <label className="font-semibold">
              Phone
            </label>

            <input
              type="text"
              name="phone"
              value={formData.phone}
              onChange={handleChange}
              className="w-full mt-2 border rounded-lg p-3"
            />

          </div>

          <div>

            <label className="font-semibold">
              Company
            </label>

            <input
              type="text"
              name="company"
              value={formData.company}
              onChange={handleChange}
              className="w-full mt-2 border rounded-lg p-3"
            />

          </div>

          <div>

            <label className="font-semibold">
              Role
            </label>

            <select
              name="role"
              value={formData.role}
              onChange={handleChange}
              className="w-full mt-2 border rounded-lg p-3"
            >
              <option>Admin</option>
              <option>Manager</option>
            </select>

          </div>

          <div>

            <label className="font-semibold">
              Status
            </label>

            <select
              name="status"
              value={formData.status}
              onChange={handleChange}
              className="w-full mt-2 border rounded-lg p-3"
            >
              <option>Active</option>
              <option>Inactive</option>
            </select>

          </div>

        </div>

        <button
          onClick={handleSave}
          className="mt-8 bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-lg flex items-center gap-2"
        >
          <Save size={18} />
          Save Changes
        </button>

      </div>

    </div>
  );
}