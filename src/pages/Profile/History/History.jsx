import { useState } from 'react';
import { Link } from 'react-router-dom';
import styles from './History.module.css';
import header_image_light from '../../../images/Profile/header-image.png';
import header_image_dark from '../../../images/Profile/header-image-dark.png';
import { FaTrash, FaCheckSquare, FaSquare, FaEllipsisV, FaSearch, FaList, FaNetworkWired } from 'react-icons/fa';

const History = ({ isDarkMode }) => {
  const [userData] = useState({
    username: 'Jaspreet Singh',
    image: 'https://randomuser.me/api/portraits/men/32.jpg',
    bio: 'Spiritual seeker and Gurbani enthusiast',
    membership: 'Gold Member'
  });

  const [historyItems, setHistoryItems] = useState([
    {
      date: 'TODAY - SATURDAY, April 26, 2025',
      items: [
        { time: '6:30PM', icon: 'grok', title: 'Grok', url: 'grok.com', selected: false },
        { time: '6:27PM', icon: 'youtube', title: '[3052] Mann Mast Malang Episode 29 Teaser - 26th April 2025 - HAR PAL GEO', url: 'youtube.com', selected: false },
        { time: '6:27PM', icon: 'youtube', title: '[3052] Mann Mast Malang Ep28 [Eng Sub] Presented by Diamond Paints - Ujooba Beauty Cream & Nestle Lactogro...', url: 'youtube.com', selected: false },
        { time: '6:25PM', icon: 'deepseek', title: 'DeepSeek - Into the Unknown', url: 'chat.deepseek.com', selected: false },
        { time: '6:20PM', icon: 'virsaa', title: 'Virsaa Web', url: 'localhost:3000', selected: false },
      ]
    },
    {
      date: 'YESTERDAY - FRIDAY, April 25, 2025',
      items: [
        { time: '5:50PM', icon: 'youtube', title: '[3052] Mann Mast Malang Ep28 [Eng Sub] Presented by Diamond Paints - Ujooba Beauty Cream & Nestle Lactogro...', url: 'youtube.com', selected: false },
        { time: '5:50PM', icon: 'youtube', title: '[3052] Youtube', url: 'youtube.com', selected: false },
        { time: '5:49PM', icon: 'youtube', title: '[3052] Youtube', url: 'youtube.com', selected: false },
        { time: '5:45PM', icon: 'google', title: 'Search for meditation techniques', url: 'google.com', selected: false },
        { time: '5:40PM', icon: 'virsaa', title: 'Virsaa Web', url: 'localhost:3000', selected: false },
      ]
    },
    {
      date: 'THURSDAY, April 24, 2025',
      items: [
        { time: '10:42AM', icon: 'google', title: 'What are credit card hacks?', url: 'exceptingpealsstipulate.com', selected: false },
        { time: '10:42AM', icon: 'stocksify', title: 'What are credit card hacks?', url: 'stocksify.com', selected: false },
        { time: '10:40AM', icon: 'newsmagics', title: 'https://newsmagics.com/money-expense-market-dividend', url: 'newsmagics.com', selected: false },
        { time: '10:38AM', icon: 'watchape', title: 'WatchApe', url: 'watchape.biz', selected: false },
      ]
    },
    {
      date: 'WEDNESDAY, April 23, 2025',
      items: [
        { time: '10:24AM', icon: 'virsaa', title: 'Virsaa Web', url: 'localhost:3000', selected: false },
        { time: '10:23AM', icon: 'stocksify', title: 'Farmers will get ₹ 2000 today under Kisan Samman Nidhi Yojana', url: 'stocksify.com', selected: false },
        { time: '10:20AM', icon: 'cashprice', title: 'Investigating the role of financial flexibility in strategic investment decisions during economic downturns', url: 'cashprice.com', selected: false },
        { time: '10:15AM', icon: 'besutichallah', title: 'https://besutichallah.top/kcDRfUdGVC0Zi/1415625/?scontetx=r_kDiA6kA1bEFcNdq2tRNAg8wCHsUY2aGCrygYAR...', url: 'besutichallah.top', selected: false },
      ]
    }
  ]);

  const [selectAll, setSelectAll] = useState(false);
  const [showMenu, setShowMenu] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState('byDate'); // 'byDate' or 'byGroup'

  const toggleSelectAll = () => {
    const newSelectAll = !selectAll;
    setSelectAll(newSelectAll);
    setHistoryItems(historyItems.map(group => ({
      ...group,
      items: group.items.map(item => ({ ...item, selected: newSelectAll }))
    })));
  };

  const toggleItemSelection = (dateIndex, itemIndex) => {
    const newHistoryItems = [...historyItems];
    newHistoryItems[dateIndex].items[itemIndex].selected = !newHistoryItems[dateIndex].items[itemIndex].selected;
    setHistoryItems(newHistoryItems);

    const allSelected = newHistoryItems.every(group =>
      group.items.every(item => item.selected)
    );
    setSelectAll(allSelected);
  };

  const deleteSelected = () => {
    const newHistoryItems = historyItems.map(group => ({
      ...group,
      items: group.items.filter(item => !item.selected)
    })).filter(group => group.items.length > 0);
    setHistoryItems(newHistoryItems);
    setSelectAll(false);
  };

  const removeItem = (dateIndex, itemIndex) => {
    const newHistoryItems = [...historyItems];
    newHistoryItems[dateIndex].items.splice(itemIndex, 1);
    setHistoryItems(newHistoryItems.filter(group => group.items.length > 0));
    setShowMenu(null);
  };

  const toggleMenu = (dateIndex, itemIndex) => {
    setShowMenu(showMenu === `${dateIndex}-${itemIndex}` ? null : `${dateIndex}-${itemIndex}`);
  };

  const handleSearch = (e) => {
    setSearchQuery(e.target.value);
  };

  const selectedCount = historyItems.reduce((count, group) =>
    count + group.items.filter(item => item.selected).length, 0);

  // Filter history items based on search query
  const filteredHistoryItems = historyItems.map(group => ({
    ...group,
    items: group.items.filter(item =>
      item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.url.toLowerCase().includes(searchQuery.toLowerCase())
    )
  })).filter(group => group.items.length > 0);

  // Group history items by domain for "By Group" view
  const groupedHistoryItems = () => {
    const grouped = {};
    historyItems.forEach(group => {
      group.items.forEach(item => {
        if (
          item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          item.url.toLowerCase().includes(searchQuery.toLowerCase())
        ) {
          const domain = item.url;
          if (!grouped[domain]) {
            grouped[domain] = [];
          }
          grouped[domain].push({ ...item, date: group.date });
        }
      });
    });

    return Object.keys(grouped).map(domain => ({
      domain,
      items: grouped[domain]
    }));
  };

  const displayedItems = viewMode === 'byDate' ? filteredHistoryItems : groupedHistoryItems();

  return (
    <div className={styles.container}>
      {/* Header - Matches Gurbani page */}
      <div className={styles.header}>
        <img
          src={isDarkMode ? header_image_dark : header_image_light}
          alt="History Header"
          className={styles.headerImage}
        />
        <div className={styles.headerText}>
          <h1>HISTORY</h1>
          <p>Review your browsing activity</p>
        </div>
      </div>

      {/* Main Content */}
      <div className={styles.mainContent}>
        {/* User Profile Section */}
        <div className={styles.profileSection}>
          <img src={userData.image} alt="User" className={styles.profileImage} />
          <h2 className={styles.username}>{userData.username}</h2>
          <span className={styles.membership}>{userData.membership}</span>
          <p className={styles.bio}>{userData.bio}</p>
        </div>

        {/* History Section */}
        <div className={styles.historySection}>
          {/* Breadcrumb - Matches standard */}
          <div className={styles.breadcrumb}>
            <Link to="/"><span>Home</span></Link> / 
            <Link to="/account"><span> My Account</span></Link> / 
            <span>History</span>
          </div>

          {/* Search Bar or Selection Controls */}
          {selectedCount === 0 ? (
            <div className={styles.searchBar}>
              <FaSearch className={styles.searchIcon} />
              <input
                type="text"
                placeholder="Search history"
                value={searchQuery}
                onChange={handleSearch}
                className={styles.searchInput}
              />
            </div>
          ) : (
            <div className={styles.controls}>
              <div className={styles.selectAll}>
                <button onClick={toggleSelectAll} className={styles.selectAllButton}>
                  {selectAll ? <FaCheckSquare /> : <FaSquare />}
                </button>
                <span>{selectedCount} selected</span>
              </div>
              <button onClick={deleteSelected} className={styles.deleteButton}>
                <FaTrash /> Delete
              </button>
            </div>
          )}

          {/* Filter Buttons */}
          <div className={styles.filterButtons}>
            <button
              className={`${styles.filterButton} ${viewMode === 'byDate' ? styles.activeFilter : ''}`}
              onClick={() => setViewMode('byDate')}
            >
              <FaList className={styles.filterIcon} />
              By date
            </button>
            <button
              className={`${styles.filterButton} ${viewMode === 'byGroup' ? styles.activeFilter : ''}`}
              onClick={() => setViewMode('byGroup')}
            >
              <FaNetworkWired className={styles.filterIcon} />
              By group
            </button>
          </div>

          {/* History List */}
          <div className={styles.historyList}>
            {viewMode === 'byDate' ? (
              displayedItems.map((group, dateIndex) => (
                <div key={dateIndex} className={styles.dateGroup}>
                  <h3 className={styles.dateHeader}>{group.date}</h3>
                  {group.items.map((item, itemIndex) => (
                    <div
                      key={itemIndex}
                      className={`${styles.historyItem} ${showMenu === `${dateIndex}-${itemIndex}` ? styles.activeMenu : ''}`}
                    >
                      <input
                        type="checkbox"
                        checked={item.selected}
                        onChange={() => toggleItemSelection(dateIndex, itemIndex)}
                        className={styles.checkbox}
                      />
                      <span className={styles.time}>{item.time}</span>
                      <div className={`${styles.icon} ${styles[item.icon]}`}></div>
                      <div className={styles.itemDetails}>
                        <a href={`https://${item.url}`} target="_blank" rel="noopener noreferrer">
                          {item.title}
                        </a>
                        <span className={styles.url}>{item.url}</span>
                      </div>
                      <div className={styles.menuContainer}>
                        <button
                          className={styles.menuButton}
                          onClick={() => toggleMenu(dateIndex, itemIndex)}
                        >
                          <FaEllipsisV />
                        </button>
                        {showMenu === `${dateIndex}-${itemIndex}` && (
                          <div className={styles.menu}>
                            <button
                              className={styles.menuItem}
                              onClick={() => removeItem(dateIndex, itemIndex)}
                            >
                              Remove from watch history
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ))
            ) : (
              displayedItems.map((group, groupIndex) => (
                <div key={groupIndex} className={styles.dateGroup}>
                  <h3 className={styles.dateHeader}>{group.domain}</h3>
                  {group.items.map((item, itemIndex) => {
                    // Find the original dateIndex for this item to use in toggle functions
                    const dateIndex = historyItems.findIndex(d => d.date === item.date);
                    return (
                      <div
                        key={itemIndex}
                        className={`${styles.historyItem} ${showMenu === `${groupIndex}-${itemIndex}` ? styles.activeMenu : ''}`}
                      >
                        <input
                          type="checkbox"
                          checked={item.selected}
                          onChange={() => toggleItemSelection(dateIndex, historyItems[dateIndex].items.findIndex(i => i === item))}
                          className={styles.checkbox}
                        />
                        <span className={styles.time}>{item.time}</span>
                        <div className={`${styles.icon} ${styles[item.icon]}`}></div>
                        <div className={styles.itemDetails}>
                          <a href={`https://${item.url}`} target="_blank" rel="noopener noreferrer">
                            {item.title}
                          </a>
                          <span className={styles.url}>{item.url}</span>
                        </div>
                        <div className={styles.menuContainer}>
                          <button
                            className={styles.menuButton}
                            onClick={() => toggleMenu(groupIndex, itemIndex)}
                          >
                            <FaEllipsisV />
                          </button>
                          {showMenu === `${groupIndex}-${itemIndex}` && (
                            <div className={styles.menu}>
                              <button
                                className={styles.menuItem}
                                onClick={() => removeItem(dateIndex, historyItems[dateIndex].items.findIndex(i => i === item))}
                              >
                                Remove from watch history
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default History;