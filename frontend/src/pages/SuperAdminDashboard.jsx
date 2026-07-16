import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  LayoutDashboard,
  Users,
  UserCog,
  Settings,
  LogOut,
  Search,
  CheckCircle,
  XCircle,
  Pencil,
  Trash2,
} from "lucide-react";

export default function SuperAdminDashboard() {
  const [search, setSearch] = useState("");

  const [users, setUsers] = useState([
    {
      id: 1,
      name: "Dipti Bhowmik",
      email: "dipti@gmail.com",
      role: "Admin",
      status: "Active",
    },
    {
      id: 2,
      name: "Rahul Sharma",
      email: "rahul@gmail.com",
      role: "Manager",
      status: "Inactive",
    },
    {
      id: 3,
      name: "Anushka Das",
      email: "anushka@gmail.com",
      role: "Admin",
      status: "Active",
    },
  ]);

  const toggleStatus = (id) => {
    setUsers((prev) =>
      prev.map((user) =>
        user.id === id
          ? {
              ...user,
              status:
                user.status === "Active"
                  ? "Inactive"
                  : "Active",
            }
          : user
      )
    );
  };

  const deleteUser = (id) => {
    if (window.confirm("Delete this user?")) {
      setUsers(users.filter((u) => u.id !== id));
    }
  };

  const filteredUsers = users.filter(
    (user) =>
      user.name.toLowerCase().includes(search.toLowerCase()) ||
      user.email.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="flex h-screen bg-gray-100">

      {/* Sidebar */}

      <aside className="w-64 bg-slate-900 text-white flex flex-col">

        <div className="p-6 text-2xl font-bold border-b border-slate-700">
          Super Admin
        </div>

        <nav className="flex-1 p-4 space-y-3">

          <button className="flex items-center gap-3 w-full p-3 rounded-lg hover:bg-slate-700">
            <LayoutDashboard size={20} />
            Dashboard
          </button>

          <button className="flex items-center gap-3 w-full p-3 rounded-lg hover:bg-slate-700">
            <Users size={20} />
            Admins
          </button>

          <button className="flex items-center gap-3 w-full p-3 rounded-lg hover:bg-slate-700">
            <UserCog size={20} />
            Managers
          </button>

          <button className="flex items-center gap-3 w-full p-3 rounded-lg hover:bg-slate-700">
            <Settings size={20} />
            Settings
          </button>

        </nav>

        <div className="p-4 border-t border-slate-700">

          <button className="flex items-center gap-3 text-red-400 hover:text-red-300">
            <LogOut size={20} />
            Logout
          </button>

        </div>

      </aside>

      {/* Main Content */}

      <main className="flex-1 overflow-auto">

        {/* Navbar */}

        <div className="bg-white shadow px-8 py-5 flex justify-between items-center">

          <h1 className="text-3xl font-bold">
            Super Admin Dashboard
          </h1>

          <div className="relative">

            <Search
              className="absolute left-3 top-3 text-gray-400"
              size={18}
            />

            <input
              type="text"
              placeholder="Search users..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="border rounded-lg pl-10 pr-4 py-2"
            />

          </div>

        </div>

        {/* Dashboard Cards */}

        <div className="grid grid-cols-4 gap-6 p-8">

          <div className="bg-white rounded-xl shadow p-6">
            <h2 className="text-gray-500">Total Users</h2>
            <h1 className="text-4xl font-bold mt-3">
              {users.length}
            </h1>
          </div>

          <div className="bg-white rounded-xl shadow p-6">
            <h2 className="text-gray-500">Admins</h2>
            <h1 className="text-4xl font-bold mt-3">
              {users.filter((u) => u.role === "Admin").length}
            </h1>
          </div>

          <div className="bg-white rounded-xl shadow p-6">
            <h2 className="text-gray-500">Managers</h2>
            <h1 className="text-4xl font-bold mt-3">
              {users.filter((u) => u.role === "Manager").length}
            </h1>
          </div>

          <div className="bg-white rounded-xl shadow p-6">
            <h2 className="text-gray-500">Active Users</h2>
            <h1 className="text-4xl font-bold mt-3">
              {users.filter((u) => u.status === "Active").length}
            </h1>
          </div>

        </div>

        {/* User Table */}

        <div className="px-8 pb-8">

          <div className="bg-white rounded-xl shadow">

            <table className="w-full">

              <thead className="bg-gray-50">

                <tr>

                  <th className="text-left p-4">Name</th>

                  <th className="text-left p-4">Email</th>

                  <th className="text-left p-4">Role</th>

                  <th className="text-left p-4">Status</th>

                  <th className="text-center p-4">Actions</th>

                </tr>

              </thead>

              <tbody>

                {filteredUsers.map((user) => (

                  <tr
                    key={user.id}
                    className="border-t"
                  >

                    <td className="p-4">
                      {user.name}
                    </td>

                    <td className="p-4">
                      {user.email}
                    </td>

                    <td className="p-4">
                      {user.role}
                    </td>

                    <td className="p-4">

                      <span
                        className={`px-3 py-1 rounded-full text-sm ${
                          user.status === "Active"
                            ? "bg-green-100 text-green-700"
                            : "bg-red-100 text-red-700"
                        }`}
                      >
                        {user.status}
                      </span>

                    </td>

                    <td className="p-4">

                      <div className="flex justify-center gap-3">

                        <button
                          className="text-blue-600 hover:text-blue-800"
                         onClick={() =>
    navigate("/edit-user", {
        state: user,
    })
}
                        >
                          <Pencil size={18} />
                        </button>

                        <button
                          className={
                            user.status === "Active"
                              ? "text-orange-500"
                              : "text-green-600"
                          }
                          onClick={() =>
                            toggleStatus(user.id)
                          }
                        >
                          {user.status === "Active" ? (
                            <XCircle size={20} />
                          ) : (
                            <CheckCircle size={20} />
                          )}
                        </button>

                        <button
                          className="text-red-600"
                          onClick={() =>
                            deleteUser(user.id)
                          }
                        >
                          <Trash2 size={18} />
                        </button>

                      </div>

                    </td>

                  </tr>

                ))}

              </tbody>

            </table>

          </div>

        </div>

      </main>

    </div>
  );
}