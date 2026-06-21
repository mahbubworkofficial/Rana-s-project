import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Fade } from "react-awesome-reveal";

const Home = () => {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [bills, setBills] = useState([]);
  const [loading, setLoading] = useState(true);

  // Banner Slides Data
  const slides = [
    {
      id: 1,
      image:
        "https://images.unsplash.com/photo-1551288049-bebda4e38f71?ixlib=rb-4.0.3&auto=format&fit=crop&w=2070&q=80",
      title: "Manage Your Utility Bills Easily",
      description: "All types of bill management in one platform",
    },
    {
      id: 2,
      image:
        "https://images.unsplash.com/photo-1620714223084-8fcacc6dfd8d?ixlib=rb-4.0.3&auto=format&fit=crop&w=2071&q=80",
      title: "Secure & Fast Bill Payments",
      description: "Protected payment system with real-time updates",
    },
    {
      id: 3,
      image:
        "https://images.unsplash.com/photo-1450101499163-c8848c66ca85?ixlib=rb-4.0.3&auto=format&fit=crop&w=2070&q=80",
      title: "Digital Reports & History",
      description: "Complete bill history and PDF report downloads",
    },
  ];

  // Categories Data
  const categories = [
    {
      id: 1,
      name: "Electricity Bill",
      icon: "⚡",
      description: "Electricity bill payment and management",
      color: "from-yellow-400 to-orange-500",
    },
    {
      id: 2,
      name: "Gas Bill",
      icon: "🔥",
      description: "All gas bill services in one place",
      color: "from-red-400 to-pink-500",
    },
    {
      id: 3,
      name: "Water Bill",
      icon: "💧",
      description: "Water bill payment and tracking",
      color: "from-blue-400 to-cyan-500",
    },
    {
      id: 4,
      name: "Internet Bill",
      icon: "🌐",
      description: "Internet and data bill management",
      color: "from-purple-400 to-indigo-500",
    },
  ];

  // Auto slide change
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % slides.length);
    }, 5000);
    return () => clearInterval(interval);
  }, [slides.length]);

  // Fetch only 6 bills
  useEffect(() => {
    const fetchBills = async () => {
      try {
        const response = await fetch(
          `${import.meta.env.VITE_API_URL}/bills/limited/6`
        );
        const data = await response.json();
        setBills(data);
      } catch (error) {
        console.error("Error fetching bills:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchBills();
  }, []);

  return (
    <div className="min-h-screen bg-base-100 text-base-content">
      {/* Banner Section */}
      <section className="relative h-96 md:h-[500px] overflow-hidden">
        {slides.map((slide, index) => (
          <div
            key={slide.id}
            className={`absolute inset-0 transition-opacity duration-1000 ${
              index === currentSlide ? "opacity-100" : "opacity-0"
            }`}
          >
            <img
              src={slide.image}
              alt={slide.title}
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
              <div className="text-center text-white px-4">
                <Fade direction="up" triggerOnce>
                  <h1 className="text-3xl md:text-5xl font-bold mb-4">
                    {slide.title}
                  </h1>
                  <p className="text-xl md:text-2xl">{slide.description}</p>
                </Fade>
              </div>
            </div>
          </div>
        ))}

        {/* Slide Indicators */}
        <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex space-x-2">
          {slides.map((_, index) => (
            <button
              key={index}
              onClick={() => setCurrentSlide(index)}
              className={`w-3 h-3 rounded-full transition-all ${
                index === currentSlide
                  ? "bg-white scale-125"
                  : "bg-white bg-opacity-50"
              }`}
            />
          ))}
        </div>
      </section>

      {/* Category Section */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <Fade direction="up" triggerOnce>
            <div className="text-center mb-12">
              <h2 className="text-4xl font-bold mb-4">Our Services</h2>
              <p className="text-xl opacity-80">
                Complete solutions for all types of utility bills
              </p>
            </div>
          </Fade>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {categories.map((category) => (
              <Fade
                key={category.id}
                direction="up"
                triggerOnce
                delay={category.id * 100}
              >
                <div className="bg-base-200 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 p-6 text-center border border-base-300">
                  <div
                    className={`text-4xl mb-4 bg-gradient-to-r ${category.color} bg-clip-text text-transparent`}
                  >
                    {category.icon}
                  </div>
                  <h3 className="text-xl font-semibold mb-2">
                    {category.name}
                  </h3>
                  <p className="opacity-80">{category.description}</p>
                  <button className="mt-4 btn btn-primary w-full">View</button>
                </div>
              </Fade>
            ))}
          </div>
        </div>
      </section>

      {/* Recent Bills Section */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <Fade direction="up" triggerOnce>
            <div className="text-center mb-12">
              <h2 className="text-4xl font-bold mb-4">Recent Bills</h2>
            </div>
          </Fade>

          {loading ? (
            <div className="flex justify-center items-center h-40">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {bills.map((bill, index) => (
                <Fade
                  key={bill._id}
                  direction="up"
                  triggerOnce
                  delay={index * 100}
                >
                  <div className="bg-base-200 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden border border-base-300">
                    <img
                      src={bill.image}
                      alt={bill.title}
                      className="w-full h-48 object-cover"
                    />

                    <div className="p-6">
                      <div className="flex justify-between items-start mb-3">
                        <h3 className="text-xl font-semibold">{bill.title}</h3>
                        <span className="badge badge-primary">
                          {bill.category}
                        </span>
                      </div>

                      <div className="space-y-2 mb-4">
                        <p>📍 {bill.location}</p>
                        <p>
                          📅 {new Date(bill.date).toLocaleDateString("en-US")}
                        </p>
                        <p className="text-2xl font-bold text-success">
                          ${bill.amount}
                        </p>
                      </div>

                      {/* View Details Link — WORKING */}
                      <Link
                        to={`/bills/${bill._id}`}
                        className="btn btn-success w-full"
                      >
                        View Details
                      </Link>
                    </div>
                  </div>
                </Fade>
              ))}
            </div>
          )}

          <Fade direction="up" triggerOnce>
            <div className="text-center mt-8">
              <Link to="/bills" className="btn btn-outline btn-primary">
                View All Bills
              </Link>
            </div>
          </Fade>
        </div>
      </section>
    </div>
  );
};

export default Home;
