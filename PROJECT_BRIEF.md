# Fidget Store — Project Brief

## Overview

This is a small online storefront for a student-run 3D-printed
fidget business.

Customers browse available fidgets online and submit orders.
Customers do NOT pay online. Payment is handled in cash in person
at school.

## Core customer workflow

1. Browse products
2. Open a product
3. Inspect its interactive 3D preview
4. Select available options/colors
5. Add the product to an order
6. Review the order
7. Enter customer information
8. Submit the order
9. See an order confirmation

## Order workflow

When an order is submitted:

1. Save the order
2. Give it a unique order number
3. Send an email notification to the business owner
4. Allow the owner to view the order in the admin interface

Orders should support statuses such as:
- New
- Printing
- Ready
- Completed

## Product workflow

Adding a product must be extremely simple.

The owner should be able to:
- Enter a product name
- Enter a price
- Enter a description
- Upload product imagery
- Upload the necessary 3D model files
- Define available color/option choices
- Publish/unpublish the product

The owner should NOT need to edit source code to add or modify products.

## 3D previews

Products need interactive 3D previews.

Where a product has multiple independently colorable parts,
the preview should allow the customer to change the relevant
colors in real time.

We should avoid pre-rendering every possible color combination.

The final model/file structure will depend on the STL files
provided by the business owner.

## Important constraint

Many business details are not yet known.

Do not invent policies, shipping, payment systems, pickup rules,
materials, pricing rules, or product options.

Use sensible placeholders where necessary and make unknown
business rules easy to change later.