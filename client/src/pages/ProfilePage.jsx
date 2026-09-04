import { useState } from 'react';
import { useAuth } from '../context/AuthContext.jsx';
import { useToast } from '../context/ToastContext.jsx';
import { authApi } from '../api/endpoints.js';
import { Card, Field, Badge } from '../components/ui.jsx';

export default function ProfilePage() {
  const { user, updateUser } = useAuth();
  const toast = useToast();
  const [profile, setProfile] = useState({ name: user.name, phone: user.phone || '' });
  const [pwd, setPwd] = useState({ currentPassword: '', newPassword: '' });

  const saveProfile = async (e) => {
    e.preventDefault();
    try {
      const res = await authApi.updateProfile(profile);
      updateUser(res.data.user);
      toast.success('Profile updated');
    } catch (err) {
      toast.error(err.message);
    }
  };

  const changePwd = async (e) => {
    e.preventDefault();
    try {
      await authApi.changePassword(pwd);
      setPwd({ currentPassword: '', newPassword: '' });
      toast.success('Password changed');
    } catch (err) {
      toast.error(err.message);
    }
  };

  return (
    <>
      <h1>My Profile</h1>
      <div className="grid grid-2 mt">
        <Card title="Account details">
          <p className="row between">
            <span className="muted">Email</span> <span>{user.email}</span>
          </p>
          <p className="row between">
            <span className="muted">Role</span> <Badge tone="info">{user.role}</Badge>
          </p>
          <form onSubmit={saveProfile} className="mt">
            <Field label="Name">
              <input value={profile.name} onChange={(e) => setProfile({ ...profile, name: e.target.value })} />
            </Field>
            <Field label="Phone">
              <input value={profile.phone} onChange={(e) => setProfile({ ...profile, phone: e.target.value })} />
            </Field>
            <button className="btn">Save changes</button>
          </form>
        </Card>

        <Card title="Change password">
          <form onSubmit={changePwd}>
            <Field label="Current password">
              <input type="password" value={pwd.currentPassword} onChange={(e) => setPwd({ ...pwd, currentPassword: e.target.value })} required />
            </Field>
            <Field label="New password">
              <input type="password" value={pwd.newPassword} onChange={(e) => setPwd({ ...pwd, newPassword: e.target.value })} required />
            </Field>
            <button className="btn">Update password</button>
          </form>
        </Card>
      </div>
    </>
  );
}
