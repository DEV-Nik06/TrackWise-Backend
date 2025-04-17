require("dotenv").config();
const express = require("express");
const cors = require("cors");
const bodyPareser = require("body-parser");
const mysql = require("mysql2");
const port = process.env.PORT || 5000;
const app = express();
app.use(cors());
app.use(express.json()); 
app.use(bodyPareser.json());

const db = mysql.createConnection({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
});

db.connect((err) => {
  if (err) {
    console.log("DB CONNECTION ERROR", err);
  } else {
    console.log("DB CONNECTED");
  }
});

app.post("/stock", (req, res) => {
  const { item_name, vendor_name, quantity, type, price } = req.body;
  const sql =
    "INSERT INTO stock (item_name, vendor_name, quantity, type, price) VALUES (?,?,?,?,?)";
  db.query(
    sql,
    [item_name, vendor_name, quantity, type, price],
    (err, result) => {
      if (err) return res.status(500).send(err);
      res.send({
        message: "Stack entry added successfully",
        id: result.insertId,
      });
    }
  );
});

app.get("/stock", (req, res) => {
  db.query("SELECT * FROM stock", (err, result) => {
    if (err) return res.status(500).send(err);
    res.send(result);
  });
});

app.delete("/stock/:id", (req, res) => {
  const { id } = req.params;
  const sql = "DELETE FROM stock WHERE id = ?";

  db.query(sql, [id], (err, result) => {
    if (err) {
      console.error("Error deleting stock:", err);
      return res.status(500).send({ message: "Internal Server Error" });
    }

    if (result.affectedRows === 0) {
      return res.status(404).send({ message: "Stock item not found" });
    }

    res.send({ message: "Stock item deleted successfully" });
  });
});


app.post("/income-expense", (req, res) => {
  const { category, type, amount } = req.body;
  // console.log("Incoming data:", { category, type, amount });

  // Check for missing data
  if (!category || !type || !amount) {
    return res.status(400).send({ message: "All fields are required" });
  }

  // Validate the type (income or expense)
  if (type !== "income" && type !== "expense") {
    return res.status(400).send({ message: "Invalid type. Must be 'income' or 'expense'" });
  }

  // Ensure amount is a valid number
  const parsedAmount = parseFloat(amount);
  if (isNaN(parsedAmount)) {
    return res.status(400).send({ message: "Amount must be a valid number" });
  }

  const sql = "INSERT INTO income_expence (category, type, amount) VALUES (?, ?, ?)";
  db.query(sql, [category, type, parsedAmount], (err, result) => {
    if (err) {
      console.error("Error adding entry:", err);
      return res.status(500).send({ message: "Internal Server Error" });
    }
    res.send({ message: "Income/Expense entry added successfully", id: result.insertId });
  });
});

app.get("/income-expense", (req, res) => {
  db.query("SELECT * FROM income_expence", (err, results) => {
    if (err) return res.status(500).send(err);
    res.send(results);
  });
});

app.delete("/income-expense/:id", (req, res) => {
  const { id } = req.params;
  const sql = "DELETE FROM income_expence WHERE id = ?";

  db.query(sql, [id], (err, result) => {
    if (err) {
      // console.error("Error deleting entry:", err);
      return res.status(500).send({ message: "Internal Server Error" });
    }
    
    if (result.affectedRows === 0) {
      return res.status(404).send({ message: "Entry not found" });
    }

    res.send({ message: "Entry deleted successfully" });
  });
});

app.post('/api/invoice', (req, res) => {
  const { customer_name, items, total_amount } = req.body;

  // Log the request body for debugging
  // console.log("Received Invoice Data:", req.body);

  // Check if items is a valid array and not empty
  if (!Array.isArray(items) || items.length === 0) {
    return res.status(400).send({ error: 'Items must be a valid array' });
  }

  // Prepare the SQL query to insert the invoice data
  const sql = 'INSERT INTO invoice (customer_name, item, total_amount) VALUES (?, ?, ?)';

  // Insert the data into the database
  db.query(sql, [customer_name, JSON.stringify(items), total_amount], (err, result) => {
    if (err) {
      // console.error("Database Error:", err);  // Log any database errors
      return res.status(500).send({ error: "Database error occurred" });
    }
    
    // Return success response with invoice ID
    res.send({ message: 'Invoice created successfully', id: result.insertId });
  });
});




app.get("/api/invoice", (req, res) => {
  db.query("SELECT * FROM invoice", (err, results) => {
    if (err) return res.status(500).send(err);

    // Convert `item` field from JSON string to an array
    const formattedResults = results.map((invoice) => ({
      ...invoice,
      item: invoice.item ? JSON.parse(invoice.item) : [], // Ensure it always returns an array
    }));

    res.send(formattedResults);
  });
});



app.listen(port, () => {
  console.log(`SERVER localhost:${port}`);
});
