"use client";
import { useEffect, useState } from "react";
import CPDForm, { CPDData } from "./CPDForm";
import CPDList from "./CPDList";
import { supabase } from "@/lib/supabaseClient";

export default function CPDPage() {
  const [cpd, setCPD] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Fetch CPD from Supabase
  useEffect(() => {
    const fetchCPD = async () => {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data, error } = await supabase
        .from("cpd")
        .select("*")
        .eq("user_id", user.id)
        .order("activity_date", { ascending: false });
      if (!error && data) {
        // Map snake_case to camelCase
        const mapped = data.map((item: any) => ({
          title: item.title,
          activityDate: item.activity_date,
          hours: item.hours,
          cpdType: item.cpd_type,
          learningMethod: item.learning_method,
          providerOrganization: item.provider_organization,
          description: item.description,
          keyLearnings: item.key_learnings,
          applicationToPractice: item.application_to_practice,
          icfCompetencies: item.icf_competencies,
          documentType: item.document_type || "Certificate",
          supportingDocument: item.supporting_document || item.certificate_proof,
          user_id: item.user_id,
          id: item.id,
        }));
        setCPD(mapped);
      }
      setLoading(false);
    };
    fetchCPD();
  }, []);

  // Add CPD to Supabase
  const addCPD = async (data: CPDData) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    let documentUrl = "";
    
    // Handle file upload if supporting document is provided
    if (data.supportingDocument && data.supportingDocument !== "") {
      const file = data.supportingDocument as any; // Assuming it's a File object
      if (file instanceof File) {
        try {
          const fileName = `${user.id}/${Date.now()}_${file.name}`;
          console.log('Uploading file:', fileName);
          
          const { data: uploadData, error: uploadError } = await supabase.storage
            .from('certificates')
            .upload(fileName, file);
          
          if (uploadError) {
            console.error('Upload error:', uploadError);
            // Continue without file upload if it fails
          } else if (uploadData) {
            const { data: urlData } = supabase.storage
              .from('certificates')
              .getPublicUrl(fileName);
            documentUrl = urlData.publicUrl;
            console.log('File uploaded successfully:', documentUrl);
          }
        } catch (error) {
          console.error('File upload failed:', error);
          // Continue without file upload if it fails
        }
      }
    }

    const { data: newCPD, error } = await supabase
      .from("cpd")
      .insert([{ 
        // Old required columns (these are NOT NULL)
        title: data.title,
        date: data.activityDate, // Map to old 'date' column
        provider: data.providerOrganization || "Not specified", // Map to old 'provider' column
        type: data.cpdType || "Other", // Map to old 'type' column
        hours: data.hours,
        notes: data.description || "", // Map to old 'notes' column
        
        // New optional columns
        activity_date: data.activityDate,
        cpd_type: data.cpdType,
        learning_method: data.learningMethod,
        provider_organization: data.providerOrganization,
        description: data.description,
        key_learnings: data.keyLearnings,
        application_to_practice: data.applicationToPractice,
        icf_competencies: data.icfCompetencies,
        document_type: data.documentType,
        supporting_document: documentUrl,
        certificate_proof: documentUrl, // Keep for backward compatibility
        user_id: user.id
      }])
      .select()
      .single();
    if (!error && newCPD) setCPD(prev => [newCPD, ...prev]);
  };

  // Delete CPD from Supabase
  const deleteCPD = async (idx: number) => {
    const item = cpd[idx];
    if (!item) return;
    const { error } = await supabase
      .from("cpd")
      .delete()
      .eq("id", item.id);
    if (!error) setCPD(prev => prev.filter((_, i) => i !== idx));
  };

  return (
    <div className="max-w-2xl mx-auto">
      <h2 className="text-xl font-bold mb-4">CPD Tracker</h2>
      <CPDForm onSubmit={addCPD} />
      {loading ? <div>Loading...</div> : <CPDList cpd={cpd} onDelete={deleteCPD} />}
    </div>
  );
} 