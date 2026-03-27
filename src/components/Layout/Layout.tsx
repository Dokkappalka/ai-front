import { Outlet } from 'react-router-dom';
import Header from '../ui/Header/Header';
import styles from './Layout.module.scss';
const Layout = () => {
  return (
    <main className={styles.container}>
      <Header/>
      <Outlet/>
      {/* <Footer/> */}
    </main>
  );
};

export default Layout;

