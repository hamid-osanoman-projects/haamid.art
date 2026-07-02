import React from 'react';
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { Page, Text, View, Document, StyleSheet, pdf } from '@react-pdf/renderer';

export const runtime = 'nodejs'; // Ensure runs on standard Node.js runtime environment

const styles = StyleSheet.create({
  page: {
    padding: 50,
    fontFamily: 'Helvetica',
    fontSize: 10,
    lineHeight: 1.6,
    color: '#333'
  },
  header: {
    borderBottomWidth: 1,
    borderBottomColor: '#7F77DD',
    paddingBottom: 15,
    marginBottom: 20
  },
  name: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#0a0a0a',
    letterSpacing: -0.5
  },
  role: {
    fontSize: 12,
    color: '#7F77DD',
    marginTop: 4,
    fontWeight: 'bold'
  },
  contactRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
    color: '#666',
    fontSize: 9
  },
  section: {
    marginBottom: 20
  },
  sectionTitle: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#0a0a0a',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e5e5',
    paddingBottom: 4,
    marginBottom: 10,
    textTransform: 'uppercase',
    letterSpacing: 0.5
  },
  itemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 3
  },
  itemTitle: {
    fontWeight: 'bold',
    color: '#0a0a0a'
  },
  itemSubtitle: {
    color: '#666',
    fontSize: 9
  },
  itemDescription: {
    color: '#444',
    marginBottom: 10,
    fontSize: 9.5
  },
  skillsList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6
  },
  skillBadge: {
    backgroundColor: '#fafafa',
    borderWidth: 1,
    borderColor: '#e5e5e5',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 4,
    fontSize: 8.5,
    color: '#444'
  }
});

interface CVProps {
  profile: any;
  works: any[];
  projects: any[];
}

const CVDocument = ({ profile, works, projects }: CVProps) => (
  <Document>
    <Page size="A4" style={styles.page}>

      {/* Header section */}
      <View style={styles.header}>
        <Text style={styles.name}>{profile.name || 'Hamid U V'}</Text>
        <Text style={styles.role}>{profile.role || 'Web & Software Developer'}</Text>
        <View style={styles.contactRow}>
          <Text>Muscat, Oman</Text>
          <Text>hamid@haaamid.art</Text>
          <Text>https://haaamid.art</Text>
        </View>
      </View>

      {/* Profile Bio */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Summary</Text>
        <Text style={styles.itemDescription}>
          {profile.bio || 'Full-stack software developer crafting fast, beautiful digital products. Expert in Next.js, React, TypeScript, and Supabase systems. Available for freelance assignments globally.'}
        </Text>
      </View>

      {/* Experience Works */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Professional Experience</Text>
        {works.length > 0 ? (
          works.slice(0, 3).map((w, i) => (
            <View key={i}>
              <View style={styles.itemHeader}>
                <Text style={styles.itemTitle}>{w.title} at {w.client_name || 'Freelance'}</Text>
                <Text style={styles.itemSubtitle}>
                  {w.due_date ? new Date(w.due_date).toLocaleDateString(undefined, { year: 'numeric', month: 'short' }) : 'Present'}
                </Text>
              </View>
              <Text style={styles.itemDescription}>
                {w.description || 'Developed interactive elements, managed Postgres databases schemas, and automated background sync cron runners.'}
              </Text>
            </View>
          ))
        ) : (
          <View>
            <View style={styles.itemHeader}>
              <Text style={styles.itemTitle}>Lead Full-stack Developer</Text>
              <Text style={styles.itemSubtitle}>2023 - Present</Text>
            </View>
            <Text style={styles.itemDescription}>
              Specializing in corporate dashboard development, cookie-based protected routing pipelines, and automated Resend notification integrations.
            </Text>
          </View>
        )}
      </View>

      {/* Projects */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Key Projects</Text>
        {projects.length > 0 ? (
          projects.slice(0, 3).map((p, i) => (
            <View key={i}>
              <View style={styles.itemHeader}>
                <Text style={styles.itemTitle}>{p.title}</Text>
                <Text style={styles.itemSubtitle}>{p.category}</Text>
              </View>
              <Text style={styles.itemDescription}>
                {p.excerpt || 'Interactive web applications highlighting Three.js particle graphics and dynamic analytics.'}
              </Text>
            </View>
          ))
        ) : (
          <View>
            <View style={styles.itemHeader}>
              <Text style={styles.itemTitle}>Anti-Gravity Web Console</Text>
              <Text style={styles.itemSubtitle}>Interactive portfolio</Text>
            </View>
            <Text style={styles.itemDescription}>
              Built 3D mouse tracking hero fields, gamification visitor metrics loops, and full-screen CRT overlays.
            </Text>
          </View>
        )}
      </View>

      {/* Skills list */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Skills & Expertise</Text>
        <View style={styles.skillsList}>
          {['Next.js', 'React', 'TypeScript', 'Supabase', 'Tailwind CSS', 'Node.js', 'PostgreSQL', 'Three.js', 'WebGL', 'REST APIs'].map((skill, idx) => (
            <View key={idx} style={styles.skillBadge}>
              <Text>{skill}</Text>
            </View>
          ))}
        </View>
      </View>

      {/* Education */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Education</Text>
        <View style={styles.itemHeader}>
          <Text style={styles.itemTitle}>B.Sc. in Computer Science</Text>
          <Text style={styles.itemSubtitle}>Muscat College</Text>
        </View>
        <Text style={styles.itemDescription}>Muscat College, Oman (Graduated 2022)</Text>
      </View>

    </Page>
  </Document>
);

export async function GET(request: NextRequest) {
  let profile = { name: 'Hamid U V', role: 'Web & Software Developer', bio: '' };
  let works: any[] = [];
  let projects: any[] = [];

  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

    // Query details in parallel
    const [profileRes, worksRes, projectsRes] = await Promise.allSettled([
      supabase.from('profiles').select('*').eq('email', 'hamid@haaamid.art').maybeSingle(),
      supabase.from('works').select('*').limit(3),
      supabase.from('posts').select('*').limit(3)
    ]);

    if (profileRes.status === 'fulfilled' && profileRes.value.data) {
      profile = profileRes.value.data as any;
    }
    if (worksRes.status === 'fulfilled' && worksRes.value.data) {
      works = worksRes.value.data;
    }
    if (projectsRes.status === 'fulfilled' && projectsRes.value.data) {
      projects = projectsRes.value.data;
    }
  } catch (err) {
    console.warn('DB queries for CV failed, using default mock templates:', err);
  }

  try {
    // Compile PDF document structure into binary buffer
    const blobStream = await pdf(<CVDocument profile={profile} works={works} projects={projects} />).toBuffer() as unknown as BodyInit;

    return new NextResponse(blobStream, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': 'attachment; filename="CV_Hamid.pdf"'
      }
    });

  } catch (err: any) {
    console.error('PDF rendering failed:', err);
    return NextResponse.json({ error: 'Failed to compile PDF' }, { status: 500 });
  }
}
