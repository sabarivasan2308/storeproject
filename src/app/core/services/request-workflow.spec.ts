// @vitest-environment jsdom
import { describe, it, expect } from 'vitest';
import { MockDatabase } from './mock-db';

describe('Verification Request Workflow', () => {
  it('should check seeded requests have history', () => {
    const requests = MockDatabase.getRequests();
    expect(requests.length).toBeGreaterThan(0);
    
    const seeded = requests.find(r => r.id === 'REQ-001');
    expect(seeded).toBeDefined();
    if (seeded) {
      expect(seeded.status).toBe('Pending Super Admin');
      expect(seeded.approverHistory).toBeDefined();
      const history = JSON.parse(seeded.approverHistory || '[]');
      expect(history.length).toBe(2);
      expect(history[0].status).toBe('Pending Department');
      expect(history[1].status).toBe('Pending Super Admin');
    }
  });

  it('should handle approval stage transition correctly in MockDatabase', () => {
    // Let's create a mock request
    const mockReq = {
      id: 'REQ-TEST-99',
      schoolAdminEmail: 'admin@school.edu',
      schoolAdminName: 'Admin',
      institution: 'KCT',
      assetId: 'AST-11',
      assetName: 'Laptop',
      changeType: 'Quantity Update' as any,
      previousValue: '10',
      newValue: '15',
      reason: 'More students',
      status: 'Pending Department' as any,
      timestamp: '2026-07-19 12:00:00',
      comments: '',
      approverHistory: JSON.stringify([
        {
          status: 'Pending Department',
          updatedBy: 'admin@school.edu',
          updaterName: 'Admin',
          timestamp: '2026-07-19 12:00:00',
          comments: 'Request submitted'
        }
      ]),
      rejectionReason: ''
    };

    const allReqs = MockDatabase.getRequests();
    MockDatabase.saveRequests([...allReqs, mockReq]);

    // Simulate processRequest - Approve: moves to Pending Super Admin
    const reviewer = { email: 'depthead@school.edu', name: 'Dept Head', role: 'Super Admin' };
    const requests = MockDatabase.getRequests();
    const reqData = requests.find(r => r.id === 'REQ-TEST-99');
    expect(reqData).toBeDefined();

    if (reqData) {
      const currentStatus = reqData.status;
      let nextStatus = 'Pending';
      if (currentStatus === 'Pending Department') {
        nextStatus = 'Pending Super Admin';
      } else {
        nextStatus = 'Approved';
      }
      reqData.status = nextStatus as any;
      reqData.comments = 'Forwarding to Super Admin';
      
      const history = JSON.parse(reqData.approverHistory || '[]');
      history.push({
        status: nextStatus,
        updatedBy: reviewer.email,
        updaterName: reviewer.name,
        timestamp: '2026-07-19 12:05:00',
        comments: 'Forwarding to Super Admin'
      });
      reqData.approverHistory = JSON.stringify(history);
      MockDatabase.saveRequests(requests);
    }

    const updated = MockDatabase.getRequests().find(r => r.id === 'REQ-TEST-99');
    expect(updated?.status).toBe('Pending Super Admin');
    const updatedHistory = JSON.parse(updated?.approverHistory || '[]');
    expect(updatedHistory.length).toBe(2);
    expect(updatedHistory[1].status).toBe('Pending Super Admin');
    expect(updatedHistory[1].updatedBy).toBe('depthead@school.edu');

    // Clean up
    const filtered = MockDatabase.getRequests().filter(r => r.id !== 'REQ-TEST-99');
    MockDatabase.saveRequests(filtered);
  });
});
