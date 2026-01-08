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
      <div className={styles.buttonsContainer}>
        <button className={styles.button} onClick={() => {
          navigate('/chat')
        }}>Чат</button>
        <button className={styles.button} onClick={() => {
          navigate('/music')
        }}>Музыка</button>
      </div>
      <div>
        <Link className={styles.title} to='/'>AI Hype</Link>
      </div>
      <div className={styles.userContainer}>
        <p>{me?.username}</p>
        <div className={styles.menuContainer} ref={menuRef}>
          <button 
            className='bg-transparent border-none'
            onClick={toggleMenu}
          >
            <MenuIcon height={36} width={36} />
          </button>
          <div className={`${styles.dropdown} ${isMenuOpen ? styles.dropdownOpen : ''}`}>
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