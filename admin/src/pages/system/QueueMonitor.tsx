import { useState, useEffect } from 'react';
import { Card, Statistic, Row, Col, Table, Button, Tag, Space, message } from 'antd';
import { ReloadOutlined, DeleteOutlined, RedoOutlined } from '@ant-design/icons';
import api from '../../services/api';

interface QueueStats {
  waiting: number;
  active: number;
  completed: number;
  failed: number;
  delayed: number;
}

interface Job {
  id: string;
  name: string;
  data: {
    registrationNumber: string;
    visitorName: string;
    exhibitionName: string;
    timestamp: string;
  };
  progress: number;
  attemptsMade: number;
}

export default function QueueMonitor() {
  const [stats, setStats] = useState<QueueStats | null>(null);
  const [failedJobs, setFailedJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(false);
  const [autoRefresh, setAutoRefresh] = useState(true);

  const fetchStats = async () => {
    try {
      const response = await api.get('/print-queue/stats');
      setStats(response.data.data);
    } catch (error) {
      console.error('Failed to fetch queue stats:', error);
    }
  };

  const fetchFailedJobs = async () => {
    try {
      const response = await api.get('/print-queue/exhibition/all?status=failed&limit=20');
      setFailedJobs(response.data.data.jobs || []);
    } catch (error) {
      console.error('Failed to fetch failed jobs:', error);
    }
  };

  const retryJob = async (jobId: string) => {
    try {
      await api.post(`/print-queue/job/${jobId}/retry`);
      message.success('Job queued for retry');
      fetchFailedJobs();
    } catch (error) {
      message.error('Failed to retry job');
    }
  };

  const removeJob = async (jobId: string) => {
    try {
      await api.delete(`/print-queue/job/${jobId}`);
      message.success('Job removed');
      fetchFailedJobs();
    } catch (error) {
      message.error('Failed to remove job');
    }
  };

  const cleanQueue = async () => {
    try {
      setLoading(true);
      const response = await api.post('/print-queue/clean');
      message.success(`Cleaned ${response.data.data.cleaned} old jobs`);
      fetchStats();
    } catch (error) {
      message.error('Failed to clean queue');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
    fetchFailedJobs();

    if (!autoRefresh) {
      return;
    }

    const interval = setInterval(() => {
      fetchStats();
      fetchFailedJobs();
    }, 3000); // Refresh every 3 seconds

    return () => clearInterval(interval);
  }, [autoRefresh]);

  const columns = [
    {
      title: 'Job ID',
      dataIndex: 'id',
      key: 'id',
      width: 200,
      render: (text: string) => <code>{text.substring(0, 20)}...</code>,
    },
    {
      title: 'Visitor',
      dataIndex: ['data', 'visitorName'],
      key: 'visitorName',
    },
    {
      title: 'Registration #',
      dataIndex: ['data', 'registrationNumber'],
      key: 'registrationNumber',
    },
    {
      title: 'Exhibition',
      dataIndex: ['data', 'exhibitionName'],
      key: 'exhibitionName',
    },
    {
      title: 'Attempts',
      dataIndex: 'attemptsMade',
      key: 'attemptsMade',
      render: (attempts: number) => (
        <Tag color={attempts >= 3 ? 'red' : 'orange'}>{attempts}/3</Tag>
      ),
    },
    {
      title: 'Queued At',
      dataIndex: ['data', 'timestamp'],
      key: 'timestamp',
      render: (timestamp: string) => new Date(timestamp).toLocaleString(),
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_: any, record: Job) => (
        <Space>
          <Button
            size="small"
            icon={<RedoOutlined />}
            onClick={() => retryJob(record.id)}
          >
            Retry
          </Button>
          <Button
            size="small"
            danger
            icon={<DeleteOutlined />}
            onClick={() => removeJob(record.id)}
          >
            Remove
          </Button>
        </Space>
      ),
    },
  ];

  return (
    <div style={{ padding: 24 }}>
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col span={24}>
          <Space style={{ float: 'right' }}>
            <Button
              icon={<ReloadOutlined />}
              onClick={() => {
                fetchStats();
                fetchFailedJobs();
              }}
            >
              Refresh
            </Button>
            <Button
              type={autoRefresh ? 'primary' : 'default'}
              onClick={() => setAutoRefresh(!autoRefresh)}
            >
              Auto-Refresh: {autoRefresh ? 'ON' : 'OFF'}
            </Button>
            <Button
              onClick={cleanQueue}
              loading={loading}
            >
              Clean Old Jobs
            </Button>
          </Space>
        </Col>
      </Row>

      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={24} sm={12} md={8} lg={4}>
          <Card>
            <Statistic
              title="Waiting"
              value={stats?.waiting || 0}
              valueStyle={{ color: '#1890ff' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={8} lg={4}>
          <Card>
            <Statistic
              title="Active"
              value={stats?.active || 0}
              valueStyle={{ color: '#52c41a' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={8} lg={4}>
          <Card>
            <Statistic
              title="Completed"
              value={stats?.completed || 0}
              valueStyle={{ color: '#13c2c2' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={8} lg={4}>
          <Card>
            <Statistic
              title="Failed"
              value={stats?.failed || 0}
              valueStyle={{ color: '#ff4d4f' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={8} lg={4}>
          <Card>
            <Statistic
              title="Delayed"
              value={stats?.delayed || 0}
              valueStyle={{ color: '#faad14' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={8} lg={4}>
          <Card>
            <Statistic
              title="Total in Queue"
              value={(stats?.waiting || 0) + (stats?.active || 0) + (stats?.delayed || 0)}
              valueStyle={{ color: '#722ed1' }}
            />
          </Card>
        </Col>
      </Row>

      <Card title="Failed Jobs" style={{ marginTop: 16 }}>
        <Table
          columns={columns}
          dataSource={failedJobs}
          rowKey="id"
          pagination={{ pageSize: 10 }}
          size="small"
        />
      </Card>
    </div>
  );
}

