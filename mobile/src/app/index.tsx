import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { io } from "socket.io-client";

type LeadField = {
  name: string;
  values: string[];
};

type Lead = {
  id: string;
  created_time: string;
  field_data: LeadField[];
  form_id?: string;
  ad_id?: string | null;
};

const BACKEND_URL = "http://192.168.1.6:3000";

function getField(lead: Lead, fieldName: string) {
  return (
    lead.field_data?.find((field) => field.name === fieldName)?.values?.[0] ||
    "Not provided"
  );
}

export default function HomeScreen() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [connected, setConnected] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`${BACKEND_URL}/leads`)
      .then((response) => response.json())
      .then((data) => {
        setLeads(data);
      })
      .catch((error) => {
        console.error("Failed to fetch leads:", error);
      })
      .finally(() => {
        setLoading(false);
      });

    const socket = io(BACKEND_URL);

    socket.on("connect", () => {
      console.log("Connected to backend:", socket.id);
      setConnected(true);
    });

    socket.on("disconnect", () => {
      console.log("Disconnected from backend");
      setConnected(false);
    });

    socket.on("initial_leads", (existingLeads: Lead[]) => {
      setLeads(existingLeads);
    });

    socket.on("new_lead", (newLead: Lead) => {
      setLeads((currentLeads) => {
        const alreadyExists = currentLeads.some(
          (lead) => lead.id === newLead.id
        );

        if (alreadyExists) {
          return currentLeads;
        }

        return [newLead, ...currentLeads];
      });
    });

    return () => {
      socket.disconnect();
    };
  }, []);

  const renderLead = ({ item }: { item: Lead }) => {
    const fullName = getField(item, "full_name");
    const email = getField(item, "email");
    const phone = getField(item, "phone_number");

    return (
      <View style={styles.card}>
        <Text style={styles.name}>{fullName}</Text>

        <View style={styles.row}>
          <Text style={styles.label}>Email</Text>
          <Text style={styles.value}>{email}</Text>
        </View>

        <View style={styles.row}>
          <Text style={styles.label}>Phone</Text>
          <Text style={styles.value}>{phone}</Text>
        </View>

        <View style={styles.row}>
          <Text style={styles.label}>Created</Text>
          <Text style={styles.value}>
            {new Date(item.created_time).toLocaleString()}
          </Text>
        </View>

        <Text style={styles.leadId}>Lead ID: {item.id}</Text>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Meta Lead Dashboard</Text>

        <View style={styles.statusContainer}>
          <View
            style={[
              styles.statusDot,
              connected ? styles.connected : styles.disconnected,
            ]}
          />

          <Text style={styles.statusText}>
            {connected ? "Live connection" : "Disconnected"}
          </Text>
        </View>
      </View>

      <View style={styles.summary}>
        <Text style={styles.count}>{leads.length}</Text>
        <Text style={styles.countLabel}>Total Leads</Text>
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" />
          <Text style={styles.loadingText}>Loading leads...</Text>
        </View>
      ) : leads.length === 0 ? (
        <View style={styles.center}>
          <Text style={styles.emptyTitle}>No leads yet</Text>

          <Text style={styles.emptyText}>
            New Meta leads will appear here automatically.
          </Text>
        </View>
      ) : (
        <FlatList
          data={leads}
          keyExtractor={(item) => item.id}
          renderItem={renderLead}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f7fb",
  },

  header: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 15,
  },

  title: {
    fontSize: 26,
    fontWeight: "700",
    color: "#111827",
  },

  statusContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 10,
  },

  statusDot: {
    width: 9,
    height: 9,
    borderRadius: 5,
    marginRight: 7,
  },

  connected: {
    backgroundColor: "#22c55e",
  },

  disconnected: {
    backgroundColor: "#ef4444",
  },

  statusText: {
    fontSize: 14,
    color: "#6b7280",
  },

  summary: {
    marginHorizontal: 20,
    marginBottom: 15,
    padding: 18,
    borderRadius: 16,
    backgroundColor: "#ffffff",
  },

  count: {
    fontSize: 30,
    fontWeight: "700",
    color: "#2563eb",
  },

  countLabel: {
    marginTop: 3,
    fontSize: 14,
    color: "#6b7280",
  },

  list: {
    paddingHorizontal: 20,
    paddingBottom: 30,
  },

  card: {
    backgroundColor: "#ffffff",
    borderRadius: 16,
    padding: 18,
    marginBottom: 12,
  },

  name: {
    fontSize: 19,
    fontWeight: "700",
    color: "#111827",
    marginBottom: 12,
  },

  row: {
    marginBottom: 8,
  },

  label: {
    fontSize: 12,
    color: "#6b7280",
    marginBottom: 2,
  },

  value: {
    fontSize: 15,
    color: "#1f2937",
  },

  leadId: {
    marginTop: 8,
    fontSize: 10,
    color: "#9ca3af",
  },

  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 30,
  },

  loadingText: {
    marginTop: 10,
    color: "#6b7280",
  },

  emptyTitle: {
    fontSize: 20,
    fontWeight: "600",
    color: "#111827",
  },

  emptyText: {
    marginTop: 8,
    textAlign: "center",
    color: "#6b7280",
  },
});