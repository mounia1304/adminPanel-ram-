import React, { useState } from "react";
import PropTypes from "prop-types";
import { useNavigate } from "react-router-dom";
import { auth, db } from "../services/config/firebase";
import { signInWithEmailAndPassword } from "firebase/auth";
import { collection, query, where, getDocs } from "firebase/firestore";
import logoRam from "../images/logoRam.png";

const LoginAdmin = () => {
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });
  const [error, setError] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const navigate = useNavigate();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      await signInWithEmailAndPassword(auth, formData.email, formData.password);

      const usersRef = collection(db, "users");
      console.log(usersRef);
      const q = query(
        usersRef,
        where("email", "==", formData.email)
        //where("role", "==", "admin")
      );

      const snapshot = await getDocs(q);
      if (snapshot.empty) {
        throw new Error("Privilèges insuffisants");
      }

      navigate("/dashboard");
    } catch (err) {
      console.error("Erreur de connexion:", err);
      setError(
        err.code === "auth/wrong-password"
          ? "Identifiants incorrects"
          : err.message
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  // Style objet pour JSX
  const styles = {
    container: {
      display: "flex",
      justifyContent: "center",
      alignItems: "center",
      minHeight: "100vh",
      background: "linear-gradient(135deg, #F6F2ED 0%, #E3E9F0 100%)",
      padding: "2rem",
    },
    card: {
      width: "100%",
      maxWidth: "450px",
      backgroundColor: "#FFFFFF",
      borderRadius: "8px",
      boxShadow: "0 4px 20px rgba(0, 0, 0, 0.08)",
      overflow: "hidden",
      borderTop: "4px solid #C20831",
    },
    header: {
      padding: "2.5rem 2rem 1.5rem",
      textAlign: "center",
      background: "linear-gradient(to bottom, #FFFFFF, #FAFAFA)",
    },
    brandTitle: {
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      gap: "0.5rem",
    },
    brandPrimary: {
      color: "#C20831",
      fontSize: "1.8rem",
      fontWeight: "700",
      marginTop: "0.5rem",
    },
    brandSecondary: {
      color: "#1A1717",
      fontSize: "1.2rem",
      fontWeight: "500",
    },
    form: {
      padding: "0 2rem 2rem",
    },
    formGroup: {
      marginBottom: "1.5rem",
    },
    label: {
      display: "block",
      marginBottom: "0.5rem",
      color: "#1A1717",
      fontWeight: "500",
      fontSize: "0.9rem",
    },
    input: {
      width: "100%",
      padding: "0.8rem 1rem",
      border: "1px solid #DDD",
      borderRadius: "4px",
      fontSize: "1rem",
      transition: "all 0.2s",
    },
    inputFocus: {
      borderColor: "#C20831",
      boxShadow: "0 0 0 2px rgba(194, 8, 49, 0.1)",
      outline: "none",
    },
    errorMessage: {
      display: "flex",
      alignItems: "center",
      gap: "0.5rem",
      color: "#A90044",
      backgroundColor: "rgba(169, 0, 68, 0.05)",
      padding: "0.8rem 1rem",
      borderRadius: "4px",
      margin: "1rem 0",
      fontSize: "0.9rem",
    },
    submitButton: {
      width: "100%",
      padding: "1rem",
      backgroundColor: "#C20831",
      color: "white",
      border: "none",
      borderRadius: "4px",
      fontSize: "1rem",
      fontWeight: "600",
      cursor: "pointer",
      transition: "background-color 0.2s",
      display: "flex",
      justifyContent: "center",
      alignItems: "center",
      gap: "0.5rem",
    },
    submitButtonHover: {
      backgroundColor: "#A22032",
    },
    spinner: {
      width: "1rem",
      height: "1rem",
      border: "2px solid rgba(255, 255, 255, 0.3)",
      borderRadius: "50%",
      borderTopColor: "white",
      animation: "spin 1s ease-in-out infinite",
    },
    footer: {
      padding: "1.5rem",
      textAlign: "center",
      color: "#666",
      fontSize: "0.8rem",
      borderTop: "1px solid #EEE",
    },
  };

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <header style={styles.header}>
          <div style={styles.brandTitle}>
            <img
              src={logoRam}
              alt="Royal Air Maroc"
              style={{ width: "48px", height: "48px", objectFit: "contain" }}
            />
            <span style={styles.brandPrimary}>Royal Air Maroc</span>
            <span style={styles.brandSecondary}>Administration</span>
          </div>
        </header>

        <form onSubmit={handleSubmit} style={styles.form}>
          <div style={styles.formGroup}>
            <label htmlFor="email" style={styles.label}>
              Email professionnel
            </label>
            <input
              id="email"
              name="email"
              type="email"
              value={formData.email}
              onChange={handleChange}
              required
              style={styles.input}
              onFocus={(e) =>
                (e.target.style = { ...styles.input, ...styles.inputFocus })
              }
              onBlur={(e) => (e.target.style = styles.input)}
              autoComplete="username"
            />
          </div>

          <div style={styles.formGroup}>
            <label htmlFor="password" style={styles.label}>
              Mot de passe
            </label>
            <input
              id="password"
              name="password"
              type="password"
              value={formData.password}
              onChange={handleChange}
              required
              style={styles.input}
              onFocus={(e) =>
                (e.target.style = { ...styles.input, ...styles.inputFocus })
              }
              onBlur={(e) => (e.target.style = styles.input)}
              autoComplete="current-password"
            />
          </div>

          {error && (
            <div style={styles.errorMessage}>
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M12 8V12M12 16H12.01M22 12C22 17.5228 17.5228 22 12 22C6.47715 22 2 17.5228 2 12C2 6.47715 6.47715 2 12 2C17.5228 2 22 6.47715 22 12Z"
                  stroke="#A90044"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
              <span>{error}</span>
            </div>
          )}

          <button
            type="submit"
            disabled={isSubmitting}
            style={{
              ...styles.submitButton,
              ...(isSubmitting && { opacity: 0.8, pointerEvents: "none" }),
            }}
            onMouseEnter={(e) => (e.target.style.backgroundColor = "#A22032")}
            onMouseLeave={(e) => (e.target.style.backgroundColor = "#C20831")}
          >
            {isSubmitting ? (
              <>
                <span style={styles.spinner}></span>
                Connexion en cours...
              </>
            ) : (
              "Se connecter"
            )}
          </button>
        </form>

        <footer style={styles.footer}>
          <p>© Royal Air Maroc {new Date().getFullYear()}</p>
        </footer>
      </div>
    </div>
  );
};

LoginAdmin.propTypes = {
  // Ajoutez ici vos propTypes si nécessaire
};

export default LoginAdmin;
