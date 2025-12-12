import { NextResponse } from "next/server";
import nodemailer from "nodemailer";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      name,
      email,
      phone,
      origin,
      destination,
      serviceType,
      goodsType,
      packageType,
      weight,
      dimensions,
      quantity,
      description,
      estimatedCost,
      isTurkeyRoute
    } = body;

    // Validation
    if (!name || !email || !phone) {
      return NextResponse.json(
        { error: "Name, email, and phone are required" },
        { status: 400 }
      );
    }

    // Get email credentials from environment variables
    const emailUser = process.env.EMAIL_USER;
    const emailPassword = process.env.EMAIL_PASSWORD;

    if (!emailUser || !emailPassword) {
      console.error("Email credentials not configured");
      return NextResponse.json(
        { error: "Email service not configured" },
        { status: 500 }
      );
    }

    // Create transporter
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: emailUser,
        pass: emailPassword,
      },
    });

    // Format email content
    const emailSubject = isTurkeyRoute 
      ? `New Quote Request - Turkey to Ghana (${serviceType})`
      : `New Quote Request - ${origin} to ${destination}`;

    const emailHtml = `
      <!DOCTYPE html>
      <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #315694 0%, #262262 100%); color: white; padding: 20px; border-radius: 8px 8px 0 0; }
            .content { background: #f9f9f9; padding: 20px; border: 1px solid #ddd; }
            .section { margin-bottom: 20px; }
            .label { font-weight: bold; color: #315694; }
            .value { margin-top: 5px; padding: 10px; background: white; border-radius: 4px; }
            .highlight { background: #f7941d; color: white; padding: 15px; border-radius: 4px; margin: 20px 0; text-align: center; font-size: 18px; font-weight: bold; }
            .footer { background: #262262; color: white; padding: 15px; text-align: center; border-radius: 0 0 8px 8px; font-size: 12px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h2>New Quote Request - Cascade Logistics</h2>
            </div>
            <div class="content">
              ${isTurkeyRoute ? '<div class="highlight">Turkey to Ghana Route - Estimated Cost Included</div>' : '<div class="highlight">Custom Quote Request</div>'}
              
              <div class="section">
                <div class="label">Contact Information</div>
                <div class="value">
                  <strong>Name:</strong> ${name}<br>
                  <strong>Email:</strong> ${email}<br>
                  <strong>Phone:</strong> ${phone}
                </div>
              </div>

              <div class="section">
                <div class="label">Shipping Details</div>
                <div class="value">
                  <strong>Origin:</strong> ${origin}<br>
                  <strong>Destination:</strong> ${destination}<br>
                  <strong>Service Type:</strong> ${serviceType}<br>
                  <strong>Goods Type:</strong> ${goodsType}<br>
                  <strong>Package Type:</strong> ${packageType}
                </div>
              </div>

              <div class="section">
                <div class="label">Package Information</div>
                <div class="value">
                  <strong>Weight:</strong> ${weight} kg<br>
                  ${dimensions ? `<strong>Dimensions:</strong> ${dimensions}<br>` : ''}
                  <strong>Quantity:</strong> ${quantity}
                </div>
              </div>

              ${description ? `
              <div class="section">
                <div class="label">Description</div>
                <div class="value">${description}</div>
              </div>
              ` : ''}

              ${estimatedCost && isTurkeyRoute ? `
              <div class="section">
                <div class="label">Estimated Cost</div>
                <div class="value" style="font-size: 20px; font-weight: bold; color: #f7941d;">
                  ${estimatedCost}
                </div>
              </div>
              ` : ''}
            </div>
            <div class="footer">
              This quote request was submitted from the Cascade Logistics website.<br>
              Please respond to the customer at ${email}
            </div>
          </div>
        </body>
      </html>
    `;

    const textVersion = `
New Quote Request - Cascade Logistics
${isTurkeyRoute ? 'Turkey to Ghana Route - Estimated Cost Included' : 'Custom Quote Request'}

Contact Information:
Name: ${name}
Email: ${email}
Phone: ${phone}

Shipping Details:
Origin: ${origin}
Destination: ${destination}
Service Type: ${serviceType}
Goods Type: ${goodsType}
Package Type: ${packageType}

Package Information:
Weight: ${weight} kg
${dimensions ? `Dimensions: ${dimensions}\n` : ''}
Quantity: ${quantity}

${description ? `Description: ${description}\n` : ''}
${estimatedCost && isTurkeyRoute ? `Estimated Cost: ${estimatedCost}\n` : ''}

Please respond to the customer at ${email}
    `;

    // Send email
    await transporter.sendMail({
      from: emailUser,
      to: emailUser, // Send to admin email (same as sender)
      replyTo: email,
      subject: emailSubject,
      text: textVersion,
      html: emailHtml,
    });

    return NextResponse.json(
      { 
        message: "Quote request submitted successfully. We'll get back to you soon!",
        success: true
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Quote request error:", error);
    return NextResponse.json(
      { error: "An error occurred while submitting your quote request. Please try again or contact us directly." },
      { status: 500 }
    );
  }
}

