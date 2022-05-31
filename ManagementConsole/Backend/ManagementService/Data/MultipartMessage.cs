// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

using System;
using System.Collections.Generic;

namespace ManagementConsoleBackend.ManagementService.Data
{
    public static class Extensions
    {
        public static List<string> Split(this string str, int n)
        {
            var parts = new List<string>();
            for (int i = 0; i < str.Length; i += n) 
                parts.Add(str.Substring(i, Math.Min(n, str.Length-i)));

            return parts;
        }
        
        public static List<MultipartMessage> MakeMultipartMessage(this string str, int n)
        {
            var messages = new List<MultipartMessage>();
            var payloads = str.Split(n);
            var messageId = Guid.NewGuid().ToString();
            var i = 1;
            foreach (var payload in payloads)
            {
                messages.Add(new MultipartMessage
                {
                    MessageId = messageId,
                    TotalParts = payloads.Count,
                    PartNumber = i,
                    Payload = payload
                });

                i++;
            }

            return messages;
        }
    }

    public class MultipartMessage
    {
        public string Type = "MultipartMessage";
        public string MessageId;
        public int TotalParts;
        public int PartNumber;
        public string Payload;
        
    }
}