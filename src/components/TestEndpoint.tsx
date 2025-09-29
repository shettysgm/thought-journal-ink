import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { getDetectDistortionsUrl } from '@/config/api';

export const TestEndpoint = () => {
  const [testing, setTesting] = useState(false);
  const [result, setResult] = useState<any>(null);

  const testEndpoint = async () => {
    setTesting(true);
    setResult(null);
    
    const testPayload = {
      text: "I always fail at everything. This is terrible and I'll never get better.",
      context: {
        topics: [],
        commonTypes: [],
        recentPhrases: [],
        userGoals: []
      }
    };

    const url = getDetectDistortionsUrl();
    
    try {
      console.log("Testing endpoint:", url);
      console.log("Payload:", testPayload);
      
      const response = await fetch(url, {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
        },
        body: JSON.stringify(testPayload),
      });
      
      console.log("Response status:", response.status);
      console.log("Response headers:", Object.fromEntries(response.headers.entries()));
      
      const responseText = await response.text();
      console.log("Response text:", responseText);
      
      let data;
      try {
        data = JSON.parse(responseText);
      } catch (e) {
        data = { rawResponse: responseText, parseError: e.message };
      }
      
      setResult({
        status: response.status,
        ok: response.ok,
        headers: Object.fromEntries(response.headers.entries()),
        data,
        url
      });
      
    } catch (error: any) {
      console.error("Test failed:", error);
      setResult({
        error: error.message,
        url
      });
    } finally {
      setTesting(false);
    }
  };

  return (
    <Card className="max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle>Test Backend Endpoint</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <Button onClick={testEndpoint} disabled={testing}>
          {testing ? "Testing..." : "Test Endpoint"}
        </Button>
        
        {result && (
          <div className="bg-muted p-4 rounded text-sm">
            <pre>{JSON.stringify(result, null, 2)}</pre>
          </div>
        )}
      </CardContent>
    </Card>
  );
};