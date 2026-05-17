import { useState, useRef, useEffect } from 'react';
import { Beaker, ChevronDown } from 'lucide-react';

const EXAMPLES_LIST = [
  {
    id: 'java',
    lang: 'java',
    title: 'Java',
    subtitle: 'Vulnerable code snippet',
    code: `import java.sql.*;

public class UserService {
    public void getUserData(String userId) throws SQLException {
        // SQL Injection vulnerability
        Connection conn = DriverManager.getConnection("jdbc:mysql://localhost:3306/db", "root", "secret");
        Statement stmt = conn.createStatement();
        String query = "SELECT * FROM users WHERE id = '" + userId + "'";
        ResultSet rs = stmt.executeQuery(query);
        while (rs.next()) {
            System.out.println("User: " + rs.getString("username"));
        }
    }
}`
  },
  {
    id: 'python',
    lang: 'python',
    title: 'Python',
    subtitle: 'Insecure file handler',
    code: `import os

def read_user_file(filename):
    # Vulnerable to directory traversal (e.g. filename = "../../../etc/passwd")
    base_path = "/var/www/uploads"
    filepath = os.path.join(base_path, filename)
    
    with open(filepath, 'r') as f:
        data = f.read()
    return data

user_input = "../../etc/passwd"
print(read_user_file(user_input))`
  },
  {
    id: 'javascript',
    lang: 'javascript',
    title: 'JavaScript',
    subtitle: 'Async callback hell',
    code: `const fs = require('fs');

function processUserData(userId, callback) {
  fs.readFile('users.json', 'utf8', (err, data) => {
    if (err) return callback(err);
    const users = JSON.parse(data);
    const user = users.find(u => u.id === userId);
    
    fs.readFile('profiles.json', 'utf8', (err, profileData) => {
      if (err) return callback(err);
      const profiles = JSON.parse(profileData);
      user.profile = profiles.find(p => p.id === user.profileId);
      
      fs.writeFile(\`output_\${userId}.json\`, JSON.stringify(user), (err) => {
        if (err) return callback(err);
        callback(null, user);
      });
    });
  });
}`
  },
  {
    id: 'typescript',
    lang: 'typescript',
    title: 'TypeScript',
    subtitle: 'Type-unsafe API call',
    code: `interface UserResponse {
  id: string;
  name: string;
  role: 'admin' | 'user';
}

function handleApiResponse(rawJson: string): void {
  // Type casting 'any' bypasses runtime schema validation
  const data: any = JSON.parse(rawJson);
  const user = data as UserResponse;
  
  if (user.role === 'admin') {
    console.log(\`Welcome administrator: \${user.name}\`);
    // This will crash at runtime if rawJson doesn't have name or role
    grantAdminAccess(user.id);
  }
}

function grantAdminAccess(id: string) {
  console.log(\`Admin access granted to \${id}\`);
}`
  },
  {
    id: 'cpp',
    lang: 'cpp',
    title: 'C++',
    subtitle: 'Memory leak example',
    code: `#include <iostream>
#include <cstring>

class BufferManager {
private:
    char* data;
public:
    BufferManager(const char* input) {
        data = new char[strlen(input) + 1];
        strcpy(data, input);
    }
    
    // Memory leak: Missing destructor to free dynamic memory
    void printData() {
        std::cout << "Data: " << data << std::endl;
    }
};

int main() {
    BufferManager* mgr = new BufferManager("Leak sensitive dynamic memory");
    mgr->printData();
    // Memory leak: mgr is never deleted, and inner 'data' is leaked
    return 0;
}`
  },
  {
    id: 'sql',
    lang: 'sql',
    title: 'SQL',
    subtitle: 'SQL injection vulnerability',
    code: `-- Vulnerable stored procedure using dynamic SQL concatenation
CREATE PROCEDURE GetUserProfile
    @Username NVARCHAR(50)
AS
BEGIN
    DECLARE @SQL NVARCHAR(MAX);
    -- SQL Injection risk via string concat of parameter
    SET @SQL = 'SELECT UserId, Username, Email, Bio 
                FROM Users 
                WHERE Username = ''' + @Username + '''';
    
    EXECUTE sp_executesql @SQL;
END;`
  },
  {
    id: 'go',
    lang: 'go',
    title: 'Go',
    subtitle: 'Goroutine leak',
    code: `package main

import (
	"fmt"
	"time"
)

// Goroutine leak: the channel is unbuffered and has no receiver on failure
func queryData() string {
	ch := make(chan string)
	
	go func() {
		time.Sleep(2 * time.Second)
		ch <- "API result" // Blocks forever if queryData times out
	}()
	
	select {
	case res := <-ch:
		return res
	case <-time.After(500 * time.Millisecond):
		return "timeout" // returns early, leaving goroutine blocked forever
	}
}

func main() {
	fmt.Println(queryData())
}`
  },
  {
    id: 'ruby',
    lang: 'ruby',
    title: 'Ruby',
    subtitle: 'Unsafe eval usage',
    code: `class CodeRunner
  def execute_expression(user_input)
    # Severe Remote Code Execution (RCE) vulnerability using eval on unsanitized input
    result = eval(user_input)
    puts "Result of execution: #{result}"
  rescue => e
    puts "Execution failed: #{e.message}"
  end
end

runner = CodeRunner.new
# E.g. user_input = 'system("rm -rf /")'
runner.execute_expression("2 + 2")`
  }
];

export default function ExampleCodeButton({ onSelect }) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelect = (example) => {
    onSelect(example.code, example.lang);
    setIsOpen(false);
  };

  return (
    <div className="relative z-[1000]" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium bg-transparent border border-[var(--border)] text-[var(--text-secondary)] hover:border-orange-500 hover:text-orange-500 transition-all duration-200 min-h-[44px] sm:min-h-0 whitespace-nowrap"
      >
        <Beaker size={14} />
        Load Example
        <ChevronDown size={14} className={`transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div className="absolute top-full left-0 mt-1 w-64 glass-panel-solid z-[1001] overflow-hidden animate-slide-up border border-orange-500/20 shadow-glow-primary">
          <div className="py-2">
            <div className="px-5 py-3 text-[11px] font-black text-[var(--text-muted)] uppercase tracking-[0.2em] border-b border-[var(--border)] mb-1 bg-[var(--bg-surface-2)]">
              Select Example
            </div>
            <div className="max-h-80 overflow-y-auto custom-scrollbar">
              {EXAMPLES_LIST.map((example) => (
                <button
                  key={example.id}
                  onClick={() => handleSelect(example)}
                  className="w-full text-left px-6 py-3.5 text-sm text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-orange-500/10 transition-all flex items-center justify-between group border-b border-[var(--border)] last:border-0"
                >
                  <div className="flex flex-col">
                    <span className="capitalize font-bold text-[var(--text-primary)] group-hover:translate-x-1 transition-transform">
                      {example.title}
                    </span>
                    <span className="text-[10px] text-[var(--text-muted)] font-medium">
                      {example.subtitle}
                    </span>
                  </div>
                  <ChevronDown size={14} className="-rotate-90 text-dark-600 group-hover:text-primary-400 transition-colors" />
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
