import React from 'react';

import { withAdmin, withProtection, withUser } from 'hoc/auth';

import AdminPublishedProjects from 'layout/admin/published-projects/component';
import Head from 'layout/head';
import Header from 'layout/header';
import MetaIcons from 'layout/meta-icons';
import Protected from 'layout/protected';

export const getServerSideProps = withProtection(withUser(withAdmin()));

const AdminPage: React.FC = () => {
  return (
    <>
      <Head title="Admin" />
      <Protected>
        <MetaIcons />

        <main className="min-h-screen text-black bg-white">
          <Header size="base" />

          <AdminPublishedProjects />
        </main>
      </Protected>
    </>
  );
};

export default AdminPage;
