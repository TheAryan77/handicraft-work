"use client";

import { useState } from "react";
import Link from "next/link";
import { User, Mail, Lock } from "lucide-react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { registerUser } from "./actions";
import styles from "../inner.module.css";

export default function AuthPage() {
  const [isLogin, setIsLogin] = useState(true);
  const [error, setError] = useState("");
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError("");

    const formData = new FormData(e.currentTarget);
    const email = formData.get("email") as string;
    const password = formData.get("password") as string;

    if (isLogin) {
      const result = await signIn("credentials", {
        redirect: false,
        email,
        password,
      });

      if (result?.error) {
        setError(result.error);
      } else {
        router.push("/profile");
        router.refresh();
      }
    } else {
      const res = await registerUser(formData);
      if (res.error) {
        setError(res.error);
      } else {
        // Auto sign-in after register
        const result = await signIn("credentials", {
          redirect: false,
          email,
          password,
        });
        if (!result?.error) {
          router.push("/profile");
          router.refresh();
        }
      }
    }
  };

  return (
    <>
      <section className={styles.pageHeader}>
        <div className="mandala-bg" style={{ opacity: 0.1 }}></div>
        <h1 className={styles.pageTitle}>{isLogin ? "Welcome Back" : "Join Our Journey"}</h1>
        <p className={styles.pageSubtitle}>
          {isLogin 
            ? "Sign in to access your wishlist, track orders, and experience personalized recommendations for authentic Indian handicrafts."
            : "Create an account to save your favorite treasures, track your artisan orders, and unlock exclusive handcrafted collections."}
        </p>
      </section>

      <section className={styles.pageContent} style={{ backgroundColor: "var(--background-color)" }}>
        <div className="pattern2-bg"></div>
        <div className="container" style={{ maxWidth: "500px" }}>
          
          <div className={styles.card} style={{ backgroundColor: "rgba(253, 251, 247, 0.95)" }}>
            <div style={{ display: "flex", borderBottom: "1px solid var(--border-color)", marginBottom: "2rem" }}>
              <button 
                onClick={() => setIsLogin(true)}
                style={{ flex: 1, padding: "1rem", background: "none", border: "none", borderBottom: isLogin ? "3px solid var(--primary-color)" : "3px solid transparent", color: isLogin ? "var(--primary-color)" : "var(--text-light)", fontWeight: "bold", fontSize: "1.1rem", cursor: "pointer", transition: "all 0.3s" }}
              >
                Login
              </button>
              <button 
                onClick={() => setIsLogin(false)}
                style={{ flex: 1, padding: "1rem", background: "none", border: "none", borderBottom: !isLogin ? "3px solid var(--primary-color)" : "3px solid transparent", color: !isLogin ? "var(--primary-color)" : "var(--text-light)", fontWeight: "bold", fontSize: "1.1rem", cursor: "pointer", transition: "all 0.3s" }}
              >
                Sign Up
              </button>
            </div>
            
            {error && <div style={{ color: "#e74c3c", marginTop: "1rem", textAlign: "center", fontSize: "0.9rem" }}>{error}</div>}

            <form onSubmit={handleSubmit}>
              {!isLogin && (
                <div className={styles.formGroup}>
                  <label className={styles.label}>Full Name</label>
                  <div style={{ position: "relative" }}>
                    <User size={18} style={{ position: "absolute", left: "1rem", top: "50%", transform: "translateY(-50%)", color: "var(--text-light)" }} />
                    <input type="text" name="name" className={styles.input} style={{ paddingLeft: "2.5rem" }} placeholder="Enter your full name" />
                  </div>
                </div>
              )}

              <div className={styles.formGroup} style={{ marginTop: !isLogin ? "1.5rem" : "0" }}>
                <label className={styles.label}>Email Address</label>
                <div style={{ position: "relative" }}>
                  <Mail size={18} style={{ position: "absolute", left: "1rem", top: "50%", transform: "translateY(-50%)", color: "var(--text-light)" }} />
                  <input type="email" name="email" className={styles.input} style={{ paddingLeft: "2.5rem" }} placeholder="Enter your email" required />
                </div>
              </div>

              <div className={styles.formGroup} style={{ marginTop: "1.5rem" }}>
                <div className={styles.flexBetween} style={{ marginBottom: "0.3rem" }}>
                  <label className={styles.label} style={{ margin: 0 }}>Password</label>
                  {isLogin && (
                    <Link href="#" style={{ fontSize: "0.9rem", color: "var(--text-light)", textDecoration: "underline" }}>Forgot Password?</Link>
                  )}
                </div>
                <div style={{ position: "relative" }}>
                  <Lock size={18} style={{ position: "absolute", left: "1rem", top: "50%", transform: "translateY(-50%)", color: "var(--text-light)" }} />
                  <input type="password" name="password" className={styles.input} style={{ paddingLeft: "2.5rem" }} placeholder="Enter your password" required />
                </div>
              </div>

              {!isLogin && (
                <div className={styles.formGroup} style={{ marginTop: "1.5rem" }}>
                  <label className={styles.label} style={{ margin: 0, marginBottom: "0.3rem" }}>Confirm Password</label>
                  <div style={{ position: "relative" }}>
                    <Lock size={18} style={{ position: "absolute", left: "1rem", top: "50%", transform: "translateY(-50%)", color: "var(--text-light)" }} />
                    <input type="password" name="confirmPassword" className={styles.input} style={{ paddingLeft: "2.5rem" }} placeholder="Confirm your password" required />
                  </div>
                </div>
              )}

              <button type="submit" className="btn-primary" style={{ width: "100%", padding: "1rem", fontSize: "1.1rem", marginTop: "2rem" }}>
                {isLogin ? "Log In" : "Create Account"}
              </button>
            </form>
            
            <div style={{ display: "flex", alignItems: "center", margin: "1.5rem 0" }}>
              <div style={{ flex: 1, height: "1px", backgroundColor: "var(--border-color)" }}></div>
              <span style={{ padding: "0 1rem", color: "var(--text-light)", fontSize: "0.9rem" }}>OR</span>
              <div style={{ flex: 1, height: "1px", backgroundColor: "var(--border-color)" }}></div>
            </div>

            <button style={{ 
              width: "100%", 
              padding: "1rem", 
              fontSize: "1.1rem", 
              display: "flex", 
              alignItems: "center", 
              justifyContent: "center", 
              gap: "0.8rem", 
              backgroundColor: "white", 
              border: "1px solid var(--border-color)", 
              borderRadius: "4px", 
              cursor: "pointer", 
              fontWeight: 500,
              color: "var(--text-dark)",
              transition: "background-color 0.2s"
             }}
             onMouseOver={(e) => e.currentTarget.style.backgroundColor = "#f9f9f9"}
             onMouseOut={(e) => e.currentTarget.style.backgroundColor = "white"}
             onClick={() => signIn("google", { callbackUrl: "/profile" })}
            >
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" width="24px" height="24px">
                <path fill="#FFC107" d="M43.611,20.083H42V20H24v8h11.303c-1.649,4.657-6.08,8-11.303,8c-6.627,0-12-5.373-12-12c0-6.627,5.373-12,12-12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C12.955,4,4,12.955,4,24c0,11.045,8.955,20,20,20c11.045,0,20-8.955,20-20C44,22.659,43.862,21.35,43.611,20.083z"/>
                <path fill="#FF3D00" d="M6.306,14.691l6.571,4.819C14.655,15.108,18.961,12,24,12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C16.318,4,9.656,8.337,6.306,14.691z"/>
                <path fill="#4CAF50" d="M24,44c5.166,0,9.86-1.977,13.409-5.192l-6.19-5.238C29.211,35.091,26.715,36,24,36c-5.202,0-9.619-3.317-11.283-7.946l-6.522,5.025C9.505,39.556,16.227,44,24,44z"/>
                <path fill="#1976D2" d="M43.611,20.083H42V20H24v8h11.303c-0.792,2.237-2.231,4.166-4.087,5.571c0.001-0.001,0.002-0.001,0.003-0.002l6.19,5.238C36.971,39.205,44,34,44,24C44,22.659,43.862,21.35,43.611,20.083z"/>
              </svg>
              Continue with Google
            </button>
            
            <div style={{ textAlign: "center", marginTop: "1.5rem", color: "var(--text-light)" }}>
              {isLogin ? (
                <>Don't have an account? <span onClick={() => setIsLogin(false)} style={{ color: "var(--primary-color)", fontWeight: "bold", cursor: "pointer" }}>Sign up</span></>
              ) : (
                <>Already have an account? <span onClick={() => setIsLogin(true)} style={{ color: "var(--primary-color)", fontWeight: "bold", cursor: "pointer" }}>Log in</span></>
              )}
            </div>
          </div>

        </div>
      </section>
    </>
  );
}
