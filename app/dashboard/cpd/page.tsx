"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import CPDForm, { CPDData } from "./CPDForm";
import CPDList from "./CPDList";
import { supabase } from "@/lib/supabaseClient";

export default function CPDPage() {
  const router = useRouter();
  const [cpd, setCPD] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploadError, setUploadError] = useState<string | null>(null);

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
        // Map snake_case to camelCase with consistent field handling
        const mapped = data.map((item: any) => ({
          id: item.id,
          title: item.title || "",
          activityDate: item.activity_date || "",
          hours: item.hours || 0,
          cpdType: item.cpd_type || "",
          learningMethod: item.learning_method || "",
          providerOrganization: item.provider_organization || "",
          description: item.description || "",
          keyLearnings: item.key_learnings || "",
          applicationToPractice: item.application_to_practice || "",
          icfCompetencies: Array.isArray(item.icf_competencies) ? item.icf_competencies : [],
          documentType: item.document_type || "Certificate",
          supportingDocument: item.supporting_document || item.certificate_proof || "",
          // ICF category fields
          coreCompetency: item.core_competency || false,
          resourceDevelopment: item.resource_development || false,
          coreCompetencyHours: item.core_competency_hours || 0,
          resourceDevelopmentHours: item.resource_development_hours || 0,
          // ICF CCE Hours
          icfCceHours: item.icf_cce_hours !== null && item.icf_cce_hours !== undefined ? item.icf_cce_hours : true, // Default to true if not set
          user_id: item.user_id,
        }));
        setCPD(mapped);
      }
      setLoading(false);
    };
    fetchCPD();
  }, []);

  // Test storage bucket access
  useEffect(() => {
    const testStorageAccess = async () => {
      try {
        const { data, error } = await supabase.storage
          .from('certificates')
          .list('', { limit: 1 });
        
        if (error) {
          setUploadError(`Storage bucket not accessible: ${error.message}. Please check your Supabase storage configuration.`);
        } else {
          setUploadError(null);
        }
      } catch (error) {
        setUploadError('Storage test failed. Please check your Supabase configuration.');
      }
    };
    
    testStorageAccess();
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
          // Sanitize filename to avoid path issues
          const sanitizedName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
          const fileName = `${user.id}/${Date.now()}_${sanitizedName}`;
          
          // Check file size (limit to 10MB)
          if (file.size > 10 * 1024 * 1024) {
            setUploadError('File too large. Maximum size is 10MB.');
            return;
          }
          
          // First check if bucket exists and we have access
          const { data: bucketData, error: bucketError } = await supabase.storage
            .from('certificates')
            .list('', { limit: 1 });
          
          if (bucketError) {
            setUploadError(`Storage bucket error: ${bucketError.message}`);
            // Continue without file upload if bucket access fails
          } else {
            
            const { data: uploadData, error: uploadError } = await supabase.storage
              .from('certificates')
              .upload(fileName, file, {
                cacheControl: '3600',
                upsert: false
              });
            
            if (uploadError) {
              setUploadError(`Upload failed: ${uploadError.message}`);
              // Continue without file upload if it fails
            } else if (uploadData) {
              const { data: urlData } = supabase.storage
                .from('certificates')
                .getPublicUrl(fileName);
              documentUrl = urlData.publicUrl;
              setUploadError(null); // Clear any previous errors
            }
          }
        } catch (error) {
          setUploadError(`Upload failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
          // Continue without file upload if it fails
        }
      }
    }

    const { data: newCPD, error } = await supabase
      .from("cpd")
      .insert([{ 
        // Old required columns (these are NOT NULL)
        title: data.title || "Untitled CPD",
        date: data.activityDate || new Date().toISOString().split('T')[0], // Map to old 'date' column
        provider: data.providerOrganization || "Not specified", // Map to old 'provider' column
        type: data.cpdType || "Other", // Map to old 'type' column
        hours: data.hours || 0, // Ensure hours is not null
        notes: data.description || "", // Map to old 'notes' column
        
        // New optional columns
        activity_date: data.activityDate || new Date().toISOString().split('T')[0],
        cpd_type: data.cpdType || "Other",
        learning_method: data.learningMethod || "Not specified",
        provider_organization: data.providerOrganization || "Not specified",
        description: data.description || "",
        key_learnings: data.keyLearnings || "",
        application_to_practice: data.applicationToPractice || "",
        icf_competencies: data.icfCompetencies || [],
        document_type: data.documentType || "Certificate",
        supporting_document: documentUrl || "",
        certificate_proof: documentUrl || "", // Keep for backward compatibility
        
        // ICF category fields
        core_competency: data.coreCompetency || false,
        resource_development: data.resourceDevelopment || false,
        core_competency_hours: data.coreCompetencyHours || 0,
        resource_development_hours: data.resourceDevelopmentHours || 0,
        
        // ICF CCE Hours (default to true if not set)
        icf_cce_hours: data.icfCceHours !== null && data.icfCceHours !== undefined ? data.icfCceHours : true,
        
        user_id: user.id
      }])
      .select()
      .single();
    if (!error && newCPD) {
      // Map the newly created CPD entry to match the format expected by CPDList
      const mappedNewCPD = {
        id: newCPD.id,
        title: newCPD.title || "",
        activityDate: newCPD.activity_date || "",
        hours: newCPD.hours || 0,
        cpdType: newCPD.cpd_type || "",
        learningMethod: newCPD.learning_method || "",
        providerOrganization: newCPD.provider_organization || "",
        description: newCPD.description || "",
        keyLearnings: newCPD.key_learnings || "",
        applicationToPractice: newCPD.application_to_practice || "",
        icfCompetencies: Array.isArray(newCPD.icf_competencies) ? newCPD.icf_competencies : [],
        documentType: newCPD.document_type || "",
        supportingDocument: newCPD.supporting_document || "",
        // ICF category fields
        coreCompetency: newCPD.core_competency || false,
        resourceDevelopment: newCPD.resource_development || false,
        coreCompetencyHours: newCPD.core_competency_hours || 0,
        resourceDevelopmentHours: newCPD.resource_development_hours || 0,
        // ICF CCE Hours
        icfCceHours: newCPD.icf_cce_hours !== null && newCPD.icf_cce_hours !== undefined ? newCPD.icf_cce_hours : true,
        user_id: newCPD.user_id,
      };
      
      setCPD(prev => [mappedNewCPD, ...prev]);
    }
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
      <h1 className="text-2xl font-bold text-gray-900 mb-6">CPD Tracker</h1>
      {uploadError && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-red-700 text-sm">{uploadError}</p>
        </div>
      )}
      <CPDForm onSubmit={addCPD} />
      {loading ? <div>Loading...</div> : <CPDList cpd={cpd} onDelete={deleteCPD} onCardClick={(idx) => {
        const item = cpd[idx];
        if (item && item.id) {
          router.push(`/dashboard/cpd/edit/${item.id}`);
        }
      }} />}
    </div>
  );
} 
