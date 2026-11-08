import type { RandomToolQueryResult } from "@/sanity.types";
import { sanityFetch } from "@/sanity/lib/fetch";
import { randomToolQuery } from "@/sanity/lib/queries";
import { type NextRequest, NextResponse } from "next/server";

// Validate Basic Auth
function validateBasicAuth(authHeader: string | null): {
  isValid: boolean;
  username?: string;
} {
  if (!authHeader || !authHeader.startsWith("Basic ")) {
    console.error("Invalid Basic Auth header");
    return { isValid: false };
  }

  if (!process.env.BASIC_AUTH_USERNAME || !process.env.BASIC_AUTH_PASSWORD) {
    console.error("BASIC_AUTH_USERNAME or BASIC_AUTH_PASSWORD is not set");
    return { isValid: false };
  }

  try {
    // Parse Basic Auth
    const base64Credentials = authHeader.substring(6); // Remove "Basic " prefix
    const credentials = Buffer.from(base64Credentials, "base64").toString(
      "utf-8",
    );
    const [username, password] = credentials.split(":");

    // Set expected username and password
    const expectedUsername = process.env.BASIC_AUTH_USERNAME || "admin";
    const expectedPassword = process.env.BASIC_AUTH_PASSWORD || "password";

    if (username === expectedUsername && password === expectedPassword) {
      console.log("Valid username and password");
      return { isValid: true, username };
    }

    console.error("Invalid username or password");
    return { isValid: false };
  } catch (error) {
    console.error("Error validating Basic Auth", error);
    return { isValid: false };
  }
}

export async function GET(request: NextRequest) {
  // Validate Basic Auth
  const authHeader = request.headers.get("authorization");
  const authResult = validateBasicAuth(authHeader);

  if (!authResult.isValid) {
    return NextResponse.json(
      { error: "Unauthorized" },
      {
        status: 401,
        headers: {
          "WWW-Authenticate": 'Basic realm="Secure Area"',
        },
      },
    );
  }

  try {
    const toolList = await sanityFetch<RandomToolQueryResult>({
      query: randomToolQuery,
    });
    const size = toolList.length;
    const randomIndex = Math.floor(Math.random() * size);
    const tool = toolList[randomIndex];
    const data = {
      name: tool.name,
      slug: tool.slug.current,
      description: tool.description,
      link:
        tool.affiliateLink ||
        `${process.env.NEXT_PUBLIC_APP_URL}/tool/${tool.slug.current}`,
    };

    return NextResponse.json({ message: "success", data }, { status: 200 });
  } catch (error) {
    console.error("Error getting random tool:", error);
    return NextResponse.json(
      { message: "Failed to get random tool" },
      { status: 500 },
    );
  }
}
