import React, { useState, useEffect } from "react";
import "./App.css";

// Initialize Segment analytics.js
import Analytics from "analytics";
import segmentPlugin from "@analytics/segment";

const analytics = Analytics({
  app: "ace-tennis-shop",
  plugins: [
    segmentPlugin({
      writeKey: "TAODEa8irKiJP2TfczDzF5zI59M42q2x",
    }),
  ],
});

const PRODUCTS = {
  men: [
    {
      id: "m-racket-1",
      name: "Wilson Pro Staff Racket",
      price: "$199",
      category: "Racket",
      image:
        "https://cdn.pixabay.com/photo/2016/11/21/15/39/tennis-1845603_1280.jpg",
    },
    {
      id: "m-shirt-1",
      name: "Men's Tennis Shirt",
      price: "$49",
      category: "Clothes",
      image:
        "https://cdn.pixabay.com/photo/2016/11/29/03/53/people-1867009_1280.jpg",
    },
  ],
  women: [
    {
      id: "w-racket-1",
      name: "Head Graphene Racket",
      price: "$189",
      category: "Racket",
      image:
        "https://cdn.pixabay.com/photo/2016/11/21/16/03/tennis-1845632_1280.jpg",
    },
    {
      id: "w-dress-1",
      name: "Women's Tennis Dress",
      price: "$59",
      category: "Clothes",
      image:
        "https://cdn.pixabay.com/photo/2017/03/27/13/59/people-2178583_1280.jpg",
    },
  ],
};

// Simple hash function to create userId from email (same as Coach app)
const hashEmail = (email) => {
  if (!email) return null;
  let hash = 0,
    i,
    chr;
  for (i = 0; i < email.length; i++) {
    chr = email.charCodeAt(i);
    hash = (hash << 5) - hash + chr;
    hash |= 0; // Convert to 32bit integer
  }
  return "user_" + Math.abs(hash);
};

function App() {
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [profile, setProfile] = useState(null);
  const [purchasedItems, setPurchasedItems] = useState([]);

  useEffect(() => {
    const savedEmail = localStorage.getItem("email");
    const savedName = localStorage.getItem("name");
    if (savedEmail && savedName) {
      setEmail(savedEmail);
      setName(savedName);
      setProfile({ email: savedEmail, name: savedName });
      segmentIdentify({ email: savedEmail, name: savedName });
      segmentTrack("Auto Login", { email: savedEmail });
    } else {
      segmentTrack("Visited Website", { anonymous: true });
    }
  }, []);

  const segmentIdentify = ({ email, name }) => {
    const userId = hashEmail(email);
    analytics.identify(userId, { email, name });
    console.log("Segment Identify:", { userId, email, name });
  };

  const segmentTrack = (event, props) => {
    let userId = null;
    if (props.email) {
      userId = hashEmail(props.email);
    } else if (profile?.email) {
      userId = hashEmail(profile.email);
    }

    const trackProps = { ...props };
    if (userId) {
      trackProps.userId = userId;
      // Optionally remove email from props to avoid duplication
      // delete trackProps.email;
    }
    analytics.track(event, trackProps);
    console.log("Segment Track:", event, trackProps);
  };

  const handleVisitStore = () => {
    if (email && name) {
      localStorage.setItem("email", email);
      localStorage.setItem("name", name);
      setProfile({ email, name });
      segmentIdentify({ email, name });
      segmentTrack("Logged In", { email, name });
    } else {
      alert("Enter name and email to continue.");
    }
  };

  const handlePurchase = (product) => {
    if (profile) {
      segmentTrack("Order Completed", {
        email: profile.email,
        name: profile.name,
        productId: product.id,
        productName: product.name,
        price: product.price,
        category: product.category,
      });
      setPurchasedItems([...purchasedItems, product.id]);
    } else {
      alert("You must be logged in to purchase.");
    }
  };

  const handleLogout = () => {
    localStorage.clear();
    setProfile(null);
    setEmail("");
    setName("");
    setPurchasedItems([]);
    segmentTrack("Logged Out", {});
  };

  const renderProducts = (products) =>
    products.map((product) => (
      <div key={product.id} className="product-card">
        <img src={product.image} alt={product.name} className="product-image" />
        <h3>{product.name}</h3>
        <p className="price">{product.price}</p>
        <p className="category">{product.category}</p>
        <button
          onClick={() => handlePurchase(product)}
          disabled={!profile || purchasedItems.includes(product.id)}
        >
          {purchasedItems.includes(product.id) ? "Purchased" : "Buy Now"}
        </button>
      </div>
    ));

  return (
    <div className="app-container">
      <h1>Ace Tennis Shop 🎾</h1>

      {!profile ? (
        <section className="profile-section">
          <h2>Enter Your Info</h2>
          <input
            type="text"
            placeholder="Name"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <button onClick={handleVisitStore}>Login</button>
        </section>
      ) : (
        <section className="profile-welcome">
          <h2>Welcome back, {profile.name}!</h2>
          <p>Your email: {profile.email}</p>
          <button onClick={handleLogout}>Log Out</button>
        </section>
      )}

      <section className="products-section">
        <h2>Men's Collection</h2>
        <div className="product-grid">{renderProducts(PRODUCTS.men)}</div>

        <h2>Women's Collection</h2>
        <div className="product-grid">{renderProducts(PRODUCTS.women)}</div>
      </section>
    </div>
  );
}

export default App;
