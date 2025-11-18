import EmailCard from "./EmailCard";
import { useState } from "react";

export default function EmailList({ emails }) {
  if (!emails.length) {
    return (
      <p className="text-gray-400 text-center mt-4">
        No emails to show
      </p>
    );
  }

  return (
    <div className="space-y-4 mt-4">
      {emails.map((email, i) => (
        <EmailCard key={i} email={email} />
      ))}
    </div>
  );
}