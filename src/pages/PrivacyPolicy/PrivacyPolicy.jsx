/**
 * pages/PrivacyPolicy/PrivacyPolicy.jsx
 * -----------------------------------------------------------------------------
 * The Privacy Policy page (/privacy-policy). Its text lives in the database
 * (Django admin > Site pages) and is shown by LegalPage, like the other
 * policies. PrivacyPolicy.module.css is the layout every policy page uses.
 * -----------------------------------------------------------------------------
 */
import React from 'react';
import LegalPage from '../Legal/LegalPage';

const PrivacyPolicy = (props) => <LegalPage slug="privacy-policy" {...props} />;

export default PrivacyPolicy;
