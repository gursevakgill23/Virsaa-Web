
import React, { useState } from "react";
import { Link } from "react-router-dom";
import styles from "./Collections.module.css";
import book_image from "../../images/book-image.jpg";
import header_image_light from "../../images/header-image.png"; // Light mode image
import header_image_dark from "../../images/header-image-dark.png"; // Dark mode image
import { FaFilter, FaTimes } from "react-icons/fa";

const Collections = ({ isDarkMode }) => {
  const [filters, setFilters] = useState({
    title: false,
    highRatings: false,
    lessRatings: false,
    author: false,
    hasAudiobook: false,
    history: false,
    novel: false,
    biography: false,
    fiction: false,
    nonFiction: false,
  });

  const [currentPage, setCurrentPage] = useState(1);
  const [isFiltersOpen, setIsFiltersOpen] = useState(false);
  const cardsPerPage = 12;

  const handleFilterChange = (filterName) => {
    setFilters((prevFilters) => ({
      ...prevFilters,
      [filterName]: !prevFilters[filterName], // Toggle the filter state
    }));
  };

  const saveChanges = () => {
    console.log("Filters saved:", filters);
    // Add logic to apply filters
  };

  const toggleFilters = () => {
    setIsFiltersOpen(!isFiltersOpen);
  };
  const closeFilters = () => {
    setIsFiltersOpen(false);
  };

  // Dummy data for Punjabi books
  const cards = [
    {
      id: 1,
      title: "Punjab Diyan Lok Kathavan",
      author: "Sohan Singh Sital",
      rating: 4.5,
      image: book_image,
      genre: "History",
      pages: 320,
    },
    {
      id: 2,
      title: "Ik Si Anita",
      author: "Nanak Singh",
      rating: 4.2,
      image: book_image,
      genre: "Novel",
      pages: 280,
    },
    {
      id: 3,
      title: "Punjab Da Itihas",
      author: "Kirpal Singh",
      rating: 4.7,
      image: book_image,
      genre: "History",
      pages: 450,
    },
    {
      id: 4,
      title: "Heer Ranjha",
      author: "Waris Shah",
      rating: 4.8,
      image: book_image,
      genre: "Poetry",
      pages: 200,
    },
    {
      id: 5,
      title: "Nanak Singh Diyan Kahaniyan",
      author: "Nanak Singh",
      rating: 4.1,
      image: book_image,
      genre: "Short Stories",
      pages: 150,
    },
    {
      id: 6,
      title: "Punjabi Virsa",
      author: "Gurbachan Singh Bhullar",
      rating: 4.6,
      image: book_image,
      genre: "Culture",
      pages: 300,
    },
    {
      id: 7,
      title: "Sadda Punjab",
      author: "Kartar Singh Duggal",
      rating: 4.3,
      image: book_image,
      genre: "Biography",
      pages: 400,
    },
    {
      id: 8,
      title: "Punjabi Lok Geet",
      author: "Devinder Satyarthi",
      rating: 4.4,
      image: book_image,
      genre: "Music",
      pages: 250,
    },
    {
      id: 9,
      title: "Punjab Diyan Lok Kathavan",
      author: "Sohan Singh Sital",
      rating: 4.5,
      image: book_image,
      genre: "History",
      pages: 320,
    },
    {
      id: 10,
      title: "Ik Si Anita",
      author: "Nanak Singh",
      rating: 4.2,
      image: book_image,
      genre: "Novel",
      pages: 280,
    },
    {
      id: 11,
      title: "Punjab Da Itihas",
      author: "Kirpal Singh",
      rating: 4.7,
      image: book_image,
      genre: "History",
      pages: 450,
    },
    {
      id: 12,
      title: "Heer Ranjha",
      author: "Waris Shah",
      rating: 4.8,
      image: book_image,
      genre: "Poetry",
      pages: 200,
    },
    {
      id: 13,
      title: "Nanak Singh Diyan Kahaniyan",
      author: "Nanak Singh",
      rating: 4.1,
      image: book_image,
      genre: "Short Stories",
      pages: 150,
    },
    {
      id: 14,
      title: "Punjabi Virsa",
      author: "Gurbachan Singh Bhullar",
      rating: 4.6,
      image: book_image,
      genre: "Culture",
      pages: 300,
    },
    {
      id: 15,
      title: "Sadda Punjab",
      author: "Kartar Singh Duggal",
      rating: 4.3,
      image: book_image,
      genre: "Biography",
      pages: 400,
    },
    {
      id: 16,
      title: "Punjabi Lok Geet",
      author: "Devinder Satyarthi",
      rating: 4.4,
      image: book_image,
      genre: "Music",
      pages: 250,
    },
    {
      id: 17,
      title: "Punjab Diyan Lok Kathavan",
      author: "Sohan Singh Sital",
      rating: 4.5,
      image: book_image,
      genre: "History",
      pages: 320,
    },
    {
      id: 18,
      title: "Ik Si Anita",
      author: "Nanak Singh",
      rating: 4.2,
      image: book_image,
      genre: "Novel",
      pages: 280,
    },
    {
      id: 19,
      title: "Punjab Da Itihas",
      author: "Kirpal Singh",
      rating: 4.7,
      image: book_image,
      genre: "History",
      pages: 450,
    },
    {
      id: 20,
      title: "Heer Ranjha",
      author: "Waris Shah",
      rating: 4.8,
      image: book_image,
      genre: "Poetry",
      pages: 200,
    },
    {
      id: 21,
      title: "Nanak Singh Diyan Kahaniyan",
      author: "Nanak Singh",
      rating: 4.1,
      image: book_image,
      genre: "Short Stories",
      pages: 150,
    },
    {
      id: 22,
      title: "Punjabi Virsa",
      author: "Gurbachan Singh Bhullar",
      rating: 4.6,
      image: book_image,
      genre: "Culture",
      pages: 300,
    },
    {
      id: 23,
      title: "Sadda Punjab",
      author: "Kartar Singh Duggal",
      rating: 4.3,
      image: book_image,
      genre: "Biography",
      pages: 400,
    },
    {
      id: 24,
      title: "Punjabi Lok Geet",
      author: "Devinder Satyarthi",
      rating: 4.4,
      image: book_image,
      genre: "Music",
      pages: 250,
    },
  ];

  // Pagination logic
  const indexOfLastCard = currentPage * cardsPerPage;
  const indexOfFirstCard = indexOfLastCard - cardsPerPage;
  const currentCards = cards.slice(indexOfFirstCard, indexOfLastCard);

  const paginate = (pageNumber) => setCurrentPage(pageNumber);

  // Featured Authors data
  // Featured Authors data
  const featuredAuthors = [
    {
      id: 1,
      name: "Nanak Singh",
      image: book_image,
    },
    {
      id: 2,
      name: "Amrita Pritam",
      image: book_image,
    },
    {
      id: 3,
      name: "Gurdial Singh",
      image: book_image,
    },
    {
      id: 4,
      name: "Nanak Singh",
      image: book_image,
    },
    {
      id: 5,
      name: "Amrita Pritam",
      image: book_image,
    },
    {
      id: 6,
      name: "Gurdial Singh",
      image: book_image,
    },
  ];

  return (
    <div className={styles.collectionsContainer}>
      {/* Header Image Section */}
      <div className={styles.headerImageSection}>
        <img
          src={isDarkMode ? header_image_dark : header_image_light} // Conditionally render image
          alt="Header"
          className={styles.headerImage}
        />
        <div className={styles.headerText}>
          <h1>COLLECTIONS</h1>
          <p>EBOOKS</p>
        </div>
      </div>

      {/* Breadcrumb Section */}
      <div className={styles.breadcrumb}>
        <Link to="/">
          <span>Home</span>
        </Link>{" "}
        /{" "}
        <Link to="/collections">
          <span> Collections</span>
        </Link>{" "}
        / <span> Ebooks</span>
      </div>

      {/* Search Bar and Filters Icon */}
      <div className={styles.searchAndFilters}>
        <input
          type="text"
          placeholder="Search by title, author, or keyword"
          className={styles.searchBar}
        />
        <button className={styles.filtersIcon} onClick={toggleFilters}>
          <FaFilter />
        </button>
      </div>

      {/* Main Content */}
      <div className={styles.collectionsPage}>
        {/* Filters Sidebar */}
        <div
          className={`${styles.filtersSection} ${
            isFiltersOpen ? styles.filtersOpen : ""
          }`}
        >
          <div className={styles.fullScreenFilters}>
            {/* Close Button */}
            <button className={styles.closeButton} onClick={closeFilters}>
              <FaTimes />
            </button>
            <h3>Filters</h3>

            {/* Basic Filters */}
            <div className={styles.filterButtons}>
              <button
                className={`${styles.filterButton} ${
                  filters.title ? styles.active : ""
                }`}
                onClick={() => handleFilterChange("title")}
              >
                Title
              </button>
              <button
                className={`${styles.filterButton} ${
                  filters.highRatings ? styles.active : ""
                }`}
                onClick={() => handleFilterChange("highRatings")}
              >
                High Ratings
              </button>
              <button
                className={`${styles.filterButton} ${
                  filters.lessRatings ? styles.active : ""
                }`}
                onClick={() => handleFilterChange("lessRatings")}
              >
                Less Ratings
              </button>
              <button
                className={`${styles.filterButton} ${
                  filters.author ? styles.active : ""
                }`}
                onClick={() => handleFilterChange("author")}
              >
                Author
              </button>
              <button
                className={`${styles.filterButton} ${
                  filters.dateAdded ? styles.active : ""
                }`}
                onClick={() => handleFilterChange("dateAdded")}
              >
                Date added
              </button>
              <button
                className={`${styles.filterButton} ${
                  filters.hasAudiobook ? styles.active : ""
                }`}
                onClick={() => handleFilterChange("hasAudiobook")}
              >
                Has Audiobook
              </button>
              <button
                className={`${styles.filterButton} ${
                  filters.premiumOnly ? styles.active : ""
                }`}
                onClick={() => handleFilterChange("premiumOnly")}
              >
                Premium Only
              </button>
            </div>

            {/* Genre Filters */}
            <h3>Genre</h3>
            <div className={styles.filterButtons}>
              <button
                className={`${styles.filterButton} ${
                  filters.history ? styles.active : ""
                }`}
                onClick={() => handleFilterChange("history")}
              >
                History
              </button>
              <button
                className={`${styles.filterButton} ${
                  filters.novel ? styles.active : ""
                }`}
                onClick={() => handleFilterChange("novel")}
              >
                Novel
              </button>
              <button
                className={`${styles.filterButton} ${
                  filters.biography ? styles.active : ""
                }`}
                onClick={() => handleFilterChange("biography")}
              >
                Biography
              </button>
              <button
                className={`${styles.filterButton} ${
                  filters.fiction ? styles.active : ""
                }`}
                onClick={() => handleFilterChange("fiction")}
              >
                Fiction
              </button>
              <button
                className={`${styles.filterButton} ${
                  filters.nonFiction ? styles.active : ""
                }`}
                onClick={() => handleFilterChange("nonFiction")}
              >
                Non-Fiction
              </button>
            </div>

            {/* Save Changes Button */}
            <button onClick={saveChanges} className={styles.saveButton}>
              Save Changes
            </button>
            {/* Clear Filters Button */}
            <button className={styles.clearButton}>Clear Filters</button>
          </div>
        </div>

        {/* Main Content Grid */}
        <div className={styles.gridContainer}>
          {currentCards.map((card) => (
            <div key={card.id} className={styles.card}>
              <img
                src={card.image}
                alt={card.title}
                className={styles.cardImage}
              />
              <div className={styles.cardContent}>
                <h3>{card.title}</h3>
                <p className={styles.pages}>{card.pages} pages</p>
              </div>
              <div className={styles.cardHoverActions}>
                <button className={styles.readNowButton}>Read</button>
                <button className={styles.likeButton}>Like</button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Pagination */}
      <div className={styles.pagination}>
        {Array.from(
          { length: Math.ceil(cards.length / cardsPerPage) },
          (_, i) => (
            <button key={i + 1} onClick={() => paginate(i + 1)}>
              {i + 1}
            </button>
          )
        )}
      </div>

      {/* Featured Authors Section */}
      <section className={styles.featuredAuthors}>
        <h2>Featured Authors</h2>
        <div className={styles.authorsGrid}>
          {featuredAuthors.map((author) => (
            <div key={author.id} className={styles.authorCard}>
              <img
                src={author.image}
                alt={author.name}
                className={styles.authorImage}
              />
              <h3>{author.name}</h3>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
};

export default Collections;