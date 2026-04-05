import { Link, useNavigate } from 'react-router-dom';
import { useState, useRef, useEffect } from 'react';
import styles from './Header.module.scss';
import { useMe } from '../../../api/fetchMe';
import MenuIcon from '../../../assets/icons/menu.svg?react';
import { fetchLogout } from '../../../api/fetchLogout';

const Header = () => {
  const navigate = useNavigate();
  const { data: me } = useMe();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);


  const fetchLogoutMutation = fetchLogout();
  const handleLogout = () => {
    fetchLogoutMutation.mutate();
  };

  const toggleMenu = () => {
    setIsMenuOpen(prev => !prev);
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsMenuOpen(false);
      }
    };

    if (isMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isMenuOpen]);
  

  return (
    <div className={styles.container}>
      <div>
        <Link className={styles.title} to='/'>AI</Link>
      </div>
      <div className={styles.contentContainer}>
        <div className={styles.buttonsContainer}>
          <button className={styles.button} onClick={() => {
            navigate('/chat')
          }}>Чат</button>
          <button className={styles.button} onClick={() => {
            navigate('/music')
          }}>Музыка</button>
        </div>
        <div className={styles.userContainer} ref={menuRef}>
          <div className={styles.userPill}>
            <span className={styles.username}>{me?.username}</span>
            <button 
              className={styles.menuButton}
              onClick={toggleMenu}
            >
              <MenuIcon height={42} width={42} />
            </button>
          </div>
          <div className={`${styles.dropdown} ${isMenuOpen ? styles.dropdownOpen : ''}`}>
            <button
              className={`${styles.menuItem} ${styles.navItemMobile}`}
              onClick={() => { navigate('/chat'); setIsMenuOpen(false); }}
            >
              Чат
            </button>
            <button
              className={`${styles.menuItem} ${styles.navItemMobile}`}
              onClick={() => { navigate('/music'); setIsMenuOpen(false); }}
            >
              Музыка
            </button>
            <button
              className={styles.menuItem}
              onClick={handleLogout}
            >
              Выход
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Header;