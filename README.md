# Psychological Test Form

A modern and interactive frontend form for psychological testing web applications. This form allows doctors to record patient responses to test images with a clean, professional interface.

## Features

- **Modern UI**: Built with Next.js and Tailwind CSS for a clean, professional look
- **Smooth Animations**: Uses Framer Motion for fluid transitions and interactions
- **Responsive Design**: Works seamlessly on both mobile and desktop devices
- **Dynamic Form Fields**: Add and remove response blocks as needed
- **Form Validation**: Built-in validation for all form fields
- **Accessible**: Follows accessibility best practices

## Technologies Used

- **Next.js**: React framework for production
- **Tailwind CSS**: Utility-first CSS framework
- **Framer Motion**: Animation library for React
- **Headless UI**: Unstyled, accessible UI components
- **Heroicons**: Beautiful hand-crafted SVG icons

## Getting Started

### Prerequisites

- Node.js 14.x or later
- npm or yarn

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/yourusername/psychological-test-form.git
   cd psychological-test-form
   ```

2. Install dependencies:
   ```bash
   npm install
   # or
   yarn install
   ```

3. Run the development server:
   ```bash
   npm run dev
   # or
   yarn dev
   ```

4. Open [http://localhost:3000](http://localhost:3000) in your browser to see the application.

## Form Fields

Each response form block contains the following fields:

1. **Position** – Dropdown (^, <, >, v, .)
2. **Response Text** – Text Input
3. **Location** – Auto-filled input (but editable)
4. **FQ** – Auto-filled input (but editable)
5. **Number of Responses** – Number Input
6. **Determinants** – Multi-select Dropdown
7. **Content** – Multi-select Dropdown
8. **DQ** – Dropdown (+, o, v, (v/+))
9. **Z-score** – Dropdown (ZW, ZA, ZD, ZS)
10. **Special Score** – Multi-select

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgments

- Inspired by psychological testing methodologies
- Built with modern web technologies
