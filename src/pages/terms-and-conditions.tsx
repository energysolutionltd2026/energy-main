import React, { useState, useEffect } from "react";
import Head from "next/head";
import NavBar from "@/components/NavBar";
import Footer from "@/components/Footer";
import tower from "@/../public/tower.jpg";

// ─── Terms Sections ───────────────────────────────────────────────────────────

const makeSections = (platformName: string, supportEmail: string, supportPhone: string) => [
  {
    id: "acceptance",
    title: "Acceptance of Terms",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className="w-5 h-5">
        <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
    content: [
      {
        subtitle: "Agreement to Terms",
        text: `By accessing or using the ${platformName} platform — including our website, mobile application, and related services — you confirm that you have read, understood, and agree to be bound by these Terms and Conditions. If you do not agree to any part of these terms, you must not use our platform.`,
      },
      {
        subtitle: "Capacity to Contract",
        text: "By using this platform, you represent that you are at least 18 years of age, possess full legal capacity to enter into binding contracts under Nigerian law, and are duly authorised to act on behalf of any business entity in whose name you are registering or transacting.",
      },
      {
        subtitle: "Continued Use",
        text: "Your continued access to or use of the platform after any modification to these Terms constitutes your acceptance of the revised Terms. It is your responsibility to review these Terms periodically for changes.",
      },
    ],
  },
  {
    id: "service",
    title: "Service Description",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className="w-5 h-5">
        <path d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
    content: [
      {
        subtitle: "Platform Overview",
        text: `${platformName} operates a digital petroleum products distribution and logistics platform that enables licensed petroleum marketers, bulk dealers, and filling station operators to place purchase orders, book product quantities, arrange truck rentals, and manage associated compliance obligations.`,
      },
      {
        subtitle: "Regulated Operations",
        text: "All services provided through this platform are subject to the regulatory framework of the Nigerian Midstream and Downstream Petroleum Regulatory Authority (NMDPRA), formerly the DPR. Users are responsible for maintaining their own valid operating licences and permits.",
      },
      {
        subtitle: "Service Availability",
        text: "We endeavour to maintain platform availability at all times but do not guarantee uninterrupted access. Scheduled maintenance, system upgrades, or circumstances beyond our control may result in temporary service interruptions. We will provide advance notice of planned downtime where practicable.",
      },
      {
        subtitle: "Third-Party Services",
        text: "The platform integrates third-party services including Paystack for payment processing and SMS notification providers. Use of such third-party services is subject to their respective terms of service, and we accept no liability for failures or errors originating from these providers.",
      },
    ],
  },
  {
    id: "accounts",
    title: "User Accounts",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className="w-5 h-5">
        <path d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
    content: [
      {
        subtitle: "Registration Requirements",
        text: "To access the full range of platform services, you must register an account and provide accurate, current, and complete information including your full legal name or business name, CAC registration number, NMDPRA/DPR licence number, contact details, and bank information where required.",
      },
      {
        subtitle: "Account Security",
        text: "You are solely responsible for maintaining the confidentiality of your login credentials and for all activities that occur under your account. You must immediately notify us at " + supportEmail + " if you suspect any unauthorised access to or use of your account.",
      },
      {
        subtitle: "Account Verification",
        text: `${platformName} reserves the right to verify the authenticity of all registration information prior to activating an account. We may request supporting documentation, including CAC certificates, DPR licences, and valid government-issued identification.`,
      },
      {
        subtitle: "Account Suspension & Termination",
        text: "We reserve the right to suspend or terminate any account that provides false information, violates these Terms, engages in fraudulent activity, or poses a risk to the integrity of the platform or other users. Termination does not extinguish any outstanding financial obligations.",
      },
    ],
  },
  {
    id: "orders",
    title: "Purchase Orders",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className="w-5 h-5">
        <path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
    content: [
      {
        subtitle: "Order Placement",
        text: "Purchase orders placed through the platform constitute a binding offer to purchase the specified petroleum product at the stated quantity and price. An order is only confirmed upon receipt of a system-generated confirmation and successful processing of the required payment or deposit.",
      },
      {
        subtitle: "Order Accuracy",
        text: "You are responsible for ensuring the accuracy of all information submitted in a purchase order, including product type, volume, delivery address, and driver and vehicle details. Errors in submitted information that result in losses or delays shall be the sole responsibility of the ordering party.",
      },
      {
        subtitle: "Minimum Order Quantities",
        text: `${platformName} may impose minimum order quantities for specific products or depots. These minimums will be clearly displayed at the time of order placement. Orders below the stated minimum will not be processed.`,
      },
      {
        subtitle: "Order Modification",
        text: "Once an order has been confirmed and payment processed, modifications are subject to availability and depot policies. Requests to amend an order must be submitted in writing to " + supportEmail + " and are not guaranteed to be accommodated.",
      },
    ],
  },
  {
    id: "booking",
    title: "Product Booking",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className="w-5 h-5">
        <path d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
    content: [
      {
        subtitle: "Booking System",
        text: "The product booking feature allows users to reserve a specified quantity of petroleum product at a selected depot for loading within a designated time window. A booking does not guarantee product availability unless confirmed by our operations team.",
      },
      {
        subtitle: "Booking Validity",
        text: "Confirmed bookings are valid for the loading date and time window specified at the time of booking. Failure to present at the depot within the specified window may result in forfeiture of the booking and applicable fees. Extensions are at the sole discretion of the depot operator.",
      },
      {
        subtitle: "Driver & Vehicle Requirements",
        text: "All vehicle and driver details submitted for a booking must match the information presented at the depot gate. Any discrepancy may result in refusal of loading. It is your responsibility to ensure driver licences, vehicle roadworthiness certificates, and tanker certifications are current and valid.",
      },
      {
        subtitle: "Depot-Specific Rules",
        text: "Each depot partner may impose additional operational requirements including safety inductions, PPE compliance, and sequencing protocols. Users and their logistics agents must comply with all depot-specific rules. Non-compliance may result in loading refusal without entitlement to a refund.",
      },
    ],
  },
  {
    id: "truck-rental",
    title: "Truck Rental",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className="w-5 h-5">
        <path d="M8 18H5a2 2 0 01-2-2v-5l3-5h11l3 5v5a2 2 0 01-2 2h-3m-8 0a2 2 0 104 0m4 0a2 2 0 104 0" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
    content: [
      {
        subtitle: "Rental Service",
        text: `${platformName} facilitates the rental of petroleum haulage trucks from registered truck owners listed on the platform. We act as an intermediary and are not the owner or operator of any listed vehicle. The rental agreement is between you and the truck owner.`,
      },
      {
        subtitle: "Rental Terms",
        text: "Rental rates, trip distances, loading capacities, and availability windows are as stated on the platform at the time of booking. All rentals are subject to the successful completion of driver and vehicle verification. Rental fees are non-refundable once the truck has been dispatched.",
      },
      {
        subtitle: "User Responsibilities",
        text: "The renting party is responsible for ensuring that the product being transported is lawfully purchased and properly documented. Any fines, penalties, or liabilities arising from carrying undocumented or improperly manifested petroleum products shall rest solely with the renting party.",
      },
      {
        subtitle: "Damage & Loss",
        text: "You are liable for any damage to the rented vehicle caused during the period of rental through negligence, improper use, or failure to comply with loading protocols. The truck owner's insurance terms will apply in the event of an accident, and any shortfall in coverage remains your responsibility.",
      },
    ],
  },
  {
    id: "union-dues",
    title: "Union Dues",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className="w-5 h-5">
        <path d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
    content: [
      {
        subtitle: "NUPENG / PENGASSAN Dues",
        text: "Certain depots and loading operations require the payment of union dues to recognised petroleum sector trade unions, including NUPENG (Nigeria Union of Petroleum and Natural Gas Workers) and PENGASSAN (Petroleum and Natural Gas Senior Staff Association of Nigeria). These fees are mandatory at applicable depots.",
      },
      {
        subtitle: "Platform Collection",
        text: `Where ${platformName} collects union dues on behalf of a depot or union, the applicable amount will be displayed during order checkout. These fees are passed directly to the relevant union or depot authority and are non-refundable once remitted.`,
      },
      {
        subtitle: "User Obligation",
        text: "It is your responsibility to confirm current union dues requirements for each depot prior to dispatch. Failure to pay required dues at the depot gate may result in loading refusal. We are not liable for delays or losses arising from unpaid third-party union obligations.",
      },
    ],
  },
  {
    id: "payment",
    title: "Payment Terms",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className="w-5 h-5">
        <path d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
    content: [
      {
        subtitle: "Payment Methods",
        text: "Payments on the platform are processed via Paystack, supporting debit/credit cards, bank transfers, and USSD. By initiating a payment, you authorise the charge to your selected payment method. All transactions are in Nigerian Naira (NGN) unless otherwise stated.",
      },
      {
        subtitle: "Payment Timing",
        text: "Full payment or a confirmed deposit is required before an order is processed or a booking is confirmed. We do not extend credit facilities through the platform. Orders placed without successful payment confirmation will be automatically cancelled after 30 minutes.",
      },
      {
        subtitle: "Failed Transactions",
        text: "If a payment fails or is reversed by your bank after an order has been confirmed and processing has commenced, we reserve the right to suspend your account and recover the outstanding amount through any lawful means, including engagement of debt recovery agents.",
      },
      {
        subtitle: "Receipts & Invoices",
        text: "System-generated receipts and invoices will be dispatched to your registered email address upon successful payment. These documents serve as proof of payment for regulatory and accounting purposes. Requests for duplicate receipts should be directed to " + supportEmail + ".",
      },
    ],
  },
  {
    id: "pricing",
    title: "Pricing & Fees",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className="w-5 h-5">
        <path d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
    content: [
      {
        subtitle: "Product Pricing",
        text: "Petroleum product prices displayed on the platform reflect prevailing ex-depot or ex-coastal prices and are subject to change without prior notice in line with NMDPRA-regulated price adjustments or market conditions. The price applicable to your order is that confirmed at the time of payment.",
      },
      {
        subtitle: "Platform Service Fees",
        text: `${platformName} may charge a platform service fee on transactions processed through the platform. Any applicable fees will be disclosed clearly before payment is completed. Service fees are non-refundable unless the order is cancelled due to an error on our part.`,
      },
      {
        subtitle: "Price Discrepancies",
        text: "In the event of a pricing error on the platform, we reserve the right to cancel the affected order and issue a full refund. We will notify you promptly in such circumstances and offer the option to re-order at the correct price.",
      },
      {
        subtitle: "Taxes & Levies",
        text: "All prices are inclusive of applicable statutory levies unless expressly stated otherwise. You are responsible for any additional taxes, duties, or levies imposed by regulatory authorities that arise specifically from your business operations.",
      },
    ],
  },
  {
    id: "delivery",
    title: "Delivery & Loading",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className="w-5 h-5">
        <path d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
    content: [
      {
        subtitle: "Loading Responsibility",
        text: "Delivery and loading of petroleum products are conducted at designated depots. It is your responsibility to present a correctly dispatched truck with a valid driver and all required documentation at the depot within the confirmed loading window.",
      },
      {
        subtitle: "Loading Documentation",
        text: "A loading order or waybill will be issued upon confirmation of your order and successful verification. This document must be presented at the depot gate. Loss of loading documentation must be reported immediately to " + supportEmail + " for reissuance.",
      },
      {
        subtitle: "Short Loading",
        text: "In the event of a short load (delivery of less than the ordered quantity), you must raise a formal complaint with the depot supervisor at the time of loading and obtain a signed short-load certificate. Claims submitted without this documentation will not be processed.",
      },
      {
        subtitle: "Delivery Risk",
        text: "Risk in the product transfers to you at the point of loading into your nominated tanker. We accept no responsibility for product loss, contamination, or quality degradation that occurs after the product has passed through the depot meter.",
      },
    ],
  },
  {
    id: "cancellation",
    title: "Cancellation",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className="w-5 h-5">
        <path d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
    content: [
      {
        subtitle: "Cancellation by User",
        text: "You may request cancellation of a confirmed order by contacting us at " + supportEmail + " prior to the loading window. Cancellations accepted before loading commences may qualify for a partial refund, subject to our Refund Policy and applicable depot charges.",
      },
      {
        subtitle: "Cancellation After Loading Commences",
        text: "Once loading has commenced at the depot, cancellation is not possible and no refund will be issued for the product loaded. You remain liable for the full order value and any ancillary costs incurred.",
      },
      {
        subtitle: "Cancellation by Platform",
        text: `${platformName} reserves the right to cancel any order where payment cannot be verified, where fraudulent activity is suspected, where product is unavailable at the selected depot, or where regulatory compliance requirements are not met. In such cases, a full refund will be issued within 5 working days.`,
      },
      {
        subtitle: "No-Show Policy",
        text: "Failure to present at the depot within the confirmed loading window without prior notice will be treated as a no-show. No-shows are subject to a cancellation fee and may affect your ability to place future bookings on the platform.",
      },
    ],
  },
  {
    id: "refunds",
    title: "Refunds",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className="w-5 h-5">
        <path d="M16 15v-1a4 4 0 00-4-4H8m0 0l3 3m-3-3l3-3m9 14V5a2 2 0 00-2-2H6a2 2 0 00-2 2v16l4-1.5 4 1.5 4-1.5 4 1.5z" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
    content: [
      {
        subtitle: "Refund Eligibility",
        text: "Refunds are issued in the following circumstances: order cancellation before loading commences (less applicable depot and service fees); product unavailability at the confirmed depot; pricing errors; or cancellation initiated by the platform without fault of the user.",
      },
      {
        subtitle: "Refund Processing",
        text: "Approved refunds will be processed to the original payment method within 5–10 working days. Refunds to bank transfer payments may take additional time depending on inter-bank processing schedules. We will provide a refund reference upon approval.",
      },
      {
        subtitle: "Non-Refundable Items",
        text: "Platform service fees, union dues remitted to third parties, SMS notification fees, and booking fees where the booking was honoured by the depot are non-refundable under all circumstances.",
      },
      {
        subtitle: "Dispute Process",
        text: "Refund disputes must be raised within 7 calendar days of the transaction date by emailing " + supportEmail + " with your order reference, payment receipt, and a clear description of the issue. Disputes raised outside this window may not be considered.",
      },
    ],
  },
  {
    id: "ip",
    title: "Intellectual Property",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className="w-5 h-5">
        <path d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
    content: [
      {
        subtitle: "Platform Ownership",
        text: `All content, software, algorithms, designs, trademarks, logos, and data structures on the ${platformName} platform are the exclusive intellectual property of ${platformName} or its licensors. Nothing in these Terms grants you any right, title, or interest in such materials.`,
      },
      {
        subtitle: "Permitted Use",
        text: "You are granted a limited, non-exclusive, non-transferable licence to access and use the platform solely for its intended commercial purpose as described herein. You may not copy, modify, distribute, sell, reverse-engineer, or create derivative works from any part of the platform.",
      },
      {
        subtitle: "User-Submitted Content",
        text: "By submitting any content, data, or documentation to the platform (including business registration documents and driver information), you grant us a non-exclusive licence to use such content for the sole purpose of delivering our services and meeting our regulatory obligations.",
      },
      {
        subtitle: "Infringement Claims",
        text: "If you believe any content on our platform infringes your intellectual property rights, please submit a written notice to " + supportEmail + " with full details of the alleged infringement. We will investigate all credible claims promptly.",
      },
    ],
  },
  {
    id: "data",
    title: "Data Protection",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className="w-5 h-5">
        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
    content: [
      {
        subtitle: "NDPR Compliance",
        text: `${platformName} processes personal data in accordance with the Nigeria Data Protection Regulation (NDPR) 2019 and any successor legislation. Our Privacy Policy, which forms part of these Terms, sets out in detail how we collect, use, store, and protect your personal information.`,
      },
      {
        subtitle: "Data You Provide",
        text: "By using the platform, you consent to the collection and processing of personal and business data as described in our Privacy Policy. You warrant that any personal data you submit about third parties (such as drivers) has been collected with the knowledge and consent of those individuals.",
      },
      {
        subtitle: "Data Retention",
        text: "We retain transaction and account data for a minimum of 7 years in compliance with Nigerian tax, commercial, and regulatory record-keeping obligations. You may request details of our retention schedules by contacting " + supportEmail + ".",
      },
      {
        subtitle: "Security Obligations",
        text: "You are responsible for maintaining the security of your account credentials and must not share login details with unauthorised persons. Any data breach resulting from your failure to secure your account credentials is your sole responsibility.",
      },
    ],
  },
  {
    id: "ai",
    title: "AI Usage",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className="w-5 h-5">
        <path d="M9 3H5a2 2 0 00-2 2v4m6-6h10a2 2 0 012 2v4M9 3v18m0 0h10a2 2 0 002-2V9M9 21H5a2 2 0 01-2-2V9m0 0h18" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
    content: [
      {
        subtitle: "AI-Assisted Features",
        text: `${platformName} employs artificial intelligence and machine learning technologies to enhance platform features including order recommendations, pricing analytics, fraud detection, and customer support responses. These tools are designed to assist — not replace — human decision-making.`,
      },
      {
        subtitle: "Accuracy Disclaimer",
        text: "AI-generated content, recommendations, and analyses are provided for informational purposes only and should not be relied upon as professional, financial, or legal advice. We do not guarantee the accuracy, completeness, or timeliness of AI-generated outputs.",
      },
      {
        subtitle: "Data Use for AI",
        text: "Aggregated and anonymised transaction data may be used to train and improve our AI models. Personally identifiable information is not used for AI training without explicit consent. You may opt out of non-essential data use by contacting " + supportEmail + ".",
      },
      {
        subtitle: "Liability for AI Outputs",
        text: "We accept no liability for any losses, decisions, or actions taken in reliance on AI-generated outputs. You are responsible for independently verifying any information or recommendation provided by AI-assisted platform features before acting on it.",
      },
    ],
  },
  {
    id: "liability",
    title: "Liability",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className="w-5 h-5">
        <path d="M3 6l3 1m0 0l-3 9a5.002 5.002 0 006.001 0M6 7l3 9M6 7l6-2m6 2l3-1m-3 1l-3 9a5.002 5.002 0 006.001 0M18 7l3 9m-3-9l-6-2m0-2v2m0 16V5m0 16H9m3 0h3" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
    content: [
      {
        subtitle: "Limitation of Liability",
        text: `To the maximum extent permitted by Nigerian law, ${platformName} and its directors, employees, and agents shall not be liable for any indirect, incidental, consequential, special, or punitive damages, including loss of profit, loss of data, business interruption, or reputational harm, arising from your use of the platform.`,
      },
      {
        subtitle: "Cap on Direct Liability",
        text: "Our aggregate liability to you for any direct damages arising from or in connection with these Terms or your use of the platform shall not exceed the total fees paid by you to us in the 3 calendar months immediately preceding the event giving rise to the claim.",
      },
      {
        subtitle: "No Warranty",
        text: `The platform and all associated services are provided on an "as is" and "as available" basis without warranties of any kind, whether express or implied, including warranties of merchantability, fitness for a particular purpose, or non-infringement.`,
      },
      {
        subtitle: "User Indemnity",
        text: `You agree to indemnify and hold harmless ${platformName}, its officers, directors, employees, and agents from any claims, damages, losses, penalties, or legal costs arising from your breach of these Terms, your misuse of the platform, or your violation of any applicable law or third-party right.`,
      },
    ],
  },
  {
    id: "disputes",
    title: "Dispute Resolution",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className="w-5 h-5">
        <path d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
    content: [
      {
        subtitle: "Informal Resolution",
        text: "In the event of any dispute arising from these Terms or your use of the platform, you agree to first attempt informal resolution by contacting our support team at " + supportEmail + " or " + supportPhone + ". We will endeavour to resolve all disputes within 14 working days.",
      },
      {
        subtitle: "Mediation",
        text: "If informal resolution is unsuccessful, either party may refer the dispute to mediation administered by the Lagos Court of Arbitration or another mutually agreed mediation body before commencing formal legal proceedings.",
      },
      {
        subtitle: "Governing Law",
        text: "These Terms and any disputes arising therefrom are governed by and construed in accordance with the laws of the Federal Republic of Nigeria. The courts of Lagos State shall have exclusive jurisdiction over any dispute not resolved through mediation.",
      },
      {
        subtitle: "Waiver of Class Action",
        text: "You agree that any dispute resolution proceedings will be conducted on an individual basis only. You waive any right to participate in a class action lawsuit or class-wide arbitration against us.",
      },
    ],
  },
  {
    id: "force-majeure",
    title: "Force Majeure",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className="w-5 h-5">
        <path d="M13 10V3L4 14h7v7l9-11h-7z" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
    content: [
      {
        subtitle: "Definition",
        text: "A Force Majeure event means any circumstance beyond the reasonable control of either party, including acts of God, natural disasters, war, civil unrest, government actions, nationwide fuel scarcity, NMDPRA supply restrictions, strikes, pandemics, or critical infrastructure failures.",
      },
      {
        subtitle: "Effect on Obligations",
        text: "Neither party shall be liable for any failure or delay in performing its obligations under these Terms to the extent that such failure or delay is caused by a Force Majeure event, provided that the affected party promptly notifies the other and takes all reasonable steps to mitigate the impact.",
      },
      {
        subtitle: "Extended Disruption",
        text: "If a Force Majeure event continues for more than 30 consecutive days, either party may terminate any affected outstanding orders by written notice. In such cases, a pro-rata refund will be issued for any portion of the order not yet fulfilled, less non-recoverable costs already incurred.",
      },
    ],
  },
  {
    id: "amendments",
    title: "Amendments",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className="w-5 h-5">
        <path d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
    content: [
      {
        subtitle: "Right to Amend",
        text: `${platformName} reserves the right to modify, update, or replace these Terms and Conditions at any time at our sole discretion. Changes reflect evolving business practices, regulatory requirements, or platform enhancements.`,
      },
      {
        subtitle: "Notice of Changes",
        text: "We will notify registered users of material changes to these Terms by email to your registered address and/or by a prominent notice on the platform at least 7 days before the changes take effect, where practicable. Non-material changes (such as corrections and clarifications) may be made without prior notice.",
      },
      {
        subtitle: "Acceptance of Amendments",
        text: "Your continued use of the platform after the effective date of any amendment constitutes your acceptance of the revised Terms. If you do not agree to the amended Terms, you must stop using the platform and may request account closure by contacting " + supportEmail + ".",
      },
      {
        subtitle: "Version History",
        text: "The effective date displayed at the top of these Terms indicates the version currently in force. Previous versions are available upon written request for a period of 24 months from the date they were superseded.",
      },
    ],
  },
  {
    id: "contact",
    title: "Contact",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className="w-5 h-5">
        <path d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
    content: [
      {
        subtitle: "Company Details",
        text: `These Terms and Conditions are issued by ${platformName}, a company incorporated in Nigeria. Registered address and company registration details are available upon request from our compliance team.`,
      },
      {
        subtitle: "General Enquiries",
        text: `For general platform enquiries, account support, or order assistance, please contact us at ${supportEmail} or call ${supportPhone} during business hours (Monday to Friday, 8:00 AM – 6:00 PM WAT).`,
      },
      {
        subtitle: "Legal & Compliance",
        text: `All formal legal notices, regulatory correspondence, and compliance queries should be directed in writing to ${supportEmail}, clearly marked "Legal Notice." We will acknowledge receipt within 2 working days.`,
      },
      {
        subtitle: "Feedback",
        text: `We value feedback from our users. If you have suggestions for improving the platform or these Terms, please write to ${supportEmail}. Your input helps us serve the Nigerian petroleum distribution community better.`,
      },
    ],
  },
];

// ─── Sidebar Nav Item ─────────────────────────────────────────────────────────

const NavItem = ({
  section,
  active,
  onClick,
}: {
  section: { id: string; title: string; icon: React.ReactNode; content: { subtitle: string; text: string }[] };
  active: boolean;
  onClick: () => void;
}) => (
  <button
    onClick={onClick}
    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left text-sm transition-all ${
      active
        ? "bg-orange-500 text-white font-semibold shadow-md"
        : "text-orange-100 hover:bg-white/10 hover:text-white"
    }`}
  >
    <span className={active ? "text-white" : "text-orange-300"}>{section.icon}</span>
    <span className="leading-tight">{section.title}</span>
  </button>
);

// ─── Main Terms & Conditions Page ─────────────────────────────────────────────

export default function TermsAndConditions() {
  const [platformInfo, setPlatformInfo] = useState({
    platformName: "e-Nergy Solutions Limited",
    supportEmail: "info@e-nergy.com.ng",
    supportPhone: "(+234) 08087550875",
  });

  useEffect(() => {
    import("@/lib/db-client")
      .then(({ api }) => api.platformSettings.get())
      .then((s) => {
        if (!s) return;
        setPlatformInfo({
          platformName: s.platformName || "e-Nergy Solutions Limited",
          supportEmail: s.supportEmail || "info@e-nergy.com.ng",
          supportPhone: s.supportPhone || "(+234) 08087550875",
        });
      })
      .catch(() => null);
  }, []);

  const SECTIONS = makeSections(
    platformInfo.platformName,
    platformInfo.supportEmail,
    platformInfo.supportPhone
  );
  const [activeSection, setActiveSection] = useState("acceptance");

  const current = SECTIONS.find((s) => s.id === activeSection)!;
  const currentIndex = SECTIONS.findIndex((s) => s.id === activeSection);

  return (
    <div
      className="min-h-screen flex flex-col bg-cover bg-center bg-no-repeat relative"
      style={{ backgroundImage: `url(${tower.src})` }}
    >
      <Head>
        <title>Terms &amp; Conditions | e-Nergy</title>
      </Head>
      <div className="absolute inset-0 bg-black/40" />
      <NavBar />

      <main className="relative z-10 flex flex-1 items-center justify-center px-4 py-6 pt-24 pb-12">
        <div className="flex w-full max-w-5xl bg-white/95 backdrop-blur-sm rounded-lg shadow-2xl border-4 border-orange-500 overflow-hidden my-10" style={{ height: "85vh" }}>

          {/* ── Left Sidebar ── */}
          <div className="hidden md:flex flex-col px-5 py-8 min-w-[240px] max-w-[260px] bg-gradient-to-b from-orange-800 to-orange-500 overflow-y-auto">
            <div className="mb-6">
              <h1 className="text-white text-xl font-extrabold uppercase leading-snug">
                Terms &amp;<br />Conditions
              </h1>
              <p className="text-orange-200 text-[10px] mt-2 leading-relaxed">
                Effective Date: January 1, 2025
              </p>
              <div className="mt-2 h-0.5 bg-orange-400 w-12 rounded" />
            </div>

            <nav className="space-y-1 flex-1 overflow-y-auto">
              {SECTIONS.map((s) => (
                <NavItem
                  key={s.id}
                  section={s}
                  active={activeSection === s.id}
                  onClick={() => setActiveSection(s.id)}
                />
              ))}
            </nav>

            <p className="text-orange-300 text-[10px] italic mt-6 leading-relaxed">
              {platformInfo.platformName} is committed to transparent and fair
              dealings with all platform users.
            </p>
          </div>

          {/* Divider */}
          <div className="hidden md:block w-px bg-gray-200 my-6" />

          {/* ── Right: Content ── */}
          <div className="flex-1 p-6 md:p-8 overflow-y-auto h-full">

            {/* Mobile section picker */}
            <div className="md:hidden mb-6">
              <label className="text-xs font-semibold tracking-widest text-gray-500 uppercase">
                Jump to Section
              </label>
              <select
                className="mt-1 w-full border border-gray-300 rounded px-3 py-2 text-sm text-gray-800 focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500 bg-white"
                value={activeSection}
                onChange={(e) => setActiveSection(e.target.value)}
              >
                {SECTIONS.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.title}
                  </option>
                ))}
              </select>
            </div>

            {/* Section Header */}
            <div className="flex items-center gap-3 mb-6 pb-4 border-b-2 border-orange-100">
              <div className="w-10 h-10 rounded-lg bg-orange-500 flex items-center justify-center text-white shrink-0">
                {current.icon}
              </div>
              <div>
                <h2 className="text-2xl font-bold text-gray-800">{current.title}</h2>
                <p className="text-xs text-gray-400 mt-0.5">
                  Section {currentIndex + 1} of {SECTIONS.length}
                </p>
              </div>
            </div>

            {/* Section Content */}
            <div className="space-y-6">
              {current.content.map((block) => (
                <div key={block.subtitle}>
                  <h3 className="text-sm font-bold text-orange-600 uppercase tracking-wide mb-1.5">
                    {block.subtitle}
                  </h3>
                  <p className="text-sm text-gray-600 leading-relaxed">{block.text}</p>
                </div>
              ))}
            </div>

            {/* Navigation */}
            <div className="flex justify-between items-center mt-10 pt-6 border-t border-gray-100">
              {currentIndex > 0 ? (
                <button
                  onClick={() => setActiveSection(SECTIONS[currentIndex - 1].id)}
                  className="text-sm font-semibold text-orange-500 hover:text-orange-600 transition"
                >
                  ‹ Previous
                </button>
              ) : (
                <div />
              )}

              {currentIndex < SECTIONS.length - 1 ? (
                <button
                  onClick={() => setActiveSection(SECTIONS[currentIndex + 1].id)}
                  className="px-6 py-2 bg-orange-500 text-white text-sm font-bold rounded hover:bg-orange-600 active:scale-95 transition-all"
                >
                  Next ›
                </button>
              ) : (
                <div className="px-6 py-2 bg-green-500 text-white text-sm font-bold rounded">
                  ✓ End of Terms
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
          <Footer />
    </div>
  );
}
