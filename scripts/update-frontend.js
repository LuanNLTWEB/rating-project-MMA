const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '../app/movie-detail.jsx');
let content = fs.readFileSync(filePath, 'utf8');
content = content.replace(/\r\n/g, '\n');

// 1. Imports
content = content.replace(
  "import { addToWatchlist, removeFromWatchlist, getWatchlistIds, updateWatchStatus } from '@/src/services/watchlistService';",
  "import { addToWatchlist, removeFromWatchlist, getWatchlistIds, updateWatchStatus } from '@/src/services/watchlistService';\nimport { getMovieReviews, createReview, deleteReview } from '@/src/services/reviewService';\nimport { reportReview } from '@/src/services/reportService';\nimport AsyncStorage from '@react-native-async-storage/async-storage';"
);

content = content.replace(
  "  View,\n  Alert,\n} from 'react-native';",
  "  View,\n  Alert,\n  TextInput,\n  Modal\n} from 'react-native';"
);

// 2. States
content = content.replace(
  "const [showWlDropdown, setShowWlDropdown] = useState(false);",
  "const [showWlDropdown, setShowWlDropdown] = useState(false);\n  const [reviews, setReviews] = useState([]);\n  const [user, setUser] = useState(null);\n  const [showReviewModal, setShowReviewModal] = useState(false);\n  const [reviewRating, setReviewRating] = useState(5);\n  const [reviewText, setReviewText] = useState('');\n  const [showReportModal, setShowReportModal] = useState(false);\n  const [reportReason, setReportReason] = useState('');\n  const [selectedReviewId, setSelectedReviewId] = useState(null);"
);

// 3. useEffect
const oldUseEffect = `  useEffect(() => {
    if (!id) return;
    let isMounted = true;
    const fetchMovie = async () => {
      try {
        setLoading(true);
        const data = await getMovie(id);
        if (isMounted) setMovie(data);
      } catch (err) {
        console.error('Fetch movie detail error:', err);
        if (isMounted) setError('Could not load movie details.');
      } finally {
        if (isMounted) setLoading(false);
      }
    };
    fetchMovie();
    return () => { isMounted = false; };
  }, [id]);`;

const newUseEffect = `  useEffect(() => {
    if (!id) return;
    let isMounted = true;
    const fetchMovieAndReviews = async () => {
      try {
        setLoading(true);
        const [data, reviewsData] = await Promise.all([
          getMovie(id),
          getMovieReviews(id).catch(() => [])
        ]);
        
        const userStr = await AsyncStorage.getItem('user');
        if (userStr && isMounted) setUser(JSON.parse(userStr));

        if (isMounted) {
          setMovie(data);
          setReviews(reviewsData);
        }
      } catch (err) {
        console.error('Fetch movie detail error:', err);
        if (isMounted) setError('Could not load movie details.');
      } finally {
        if (isMounted) setLoading(false);
      }
    };
    fetchMovieAndReviews();
    return () => { isMounted = false; };
  }, [id]);`;

content = content.replace(oldUseEffect, newUseEffect);

// 4. Handlers
const handlers = `  const handleSubmitReview = async () => {
    if (!reviewText.trim()) return Alert.alert('Error', 'Review text cannot be empty');
    try {
      await createReview(id, { overallRating: reviewRating, bodyText: reviewText });
      setShowReviewModal(false);
      setReviewText('');
      setReviewRating(5);
      const updatedReviews = await getMovieReviews(id);
      setReviews(updatedReviews);
      Alert.alert('Success', 'Review added successfully');
    } catch (err) {
      Alert.alert('Error', err?.response?.data?.message || 'Failed to add review');
    }
  };

  const handleDeleteReview = async (reviewId) => {
    Alert.alert('Delete Review', 'Are you sure?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', onPress: async () => {
          try {
            await deleteReview(reviewId);
            setReviews(reviews.filter(r => r._id !== reviewId));
          } catch (err) {
            Alert.alert('Error', 'Failed to delete review');
          }
        }
      }
    ]);
  };

  const handleSubmitReport = async () => {
    if (!reportReason.trim()) return Alert.alert('Error', 'Please enter a reason');
    try {
      await reportReview(selectedReviewId, reportReason);
      setShowReportModal(false);
      setReportReason('');
      Alert.alert('Success', 'Report submitted successfully');
    } catch (err) {
      Alert.alert('Error', err?.response?.data?.message || 'Failed to submit report');
    }
  };

`;

content = content.replace("  const wlStatusLabel = (s) => {", handlers + "  const wlStatusLabel = (s) => {");

// 5. JSX
const reviewsJsx = `          {/* Reviews Section */}
          <View style={styles.section}>
            <View style={styles.reviewHeader}>
              <Text style={styles.sectionTitle}>Reviews & Ratings</Text>
              {user && user.role === 'customer' && !reviews.some(r => r.user?._id === (user._id || user.id)) && (
                <TouchableOpacity style={styles.writeReviewBtn} onPress={() => setShowReviewModal(true)}>
                  <MaterialIcons name="edit" size={16} color="#FFF" />
                  <Text style={styles.writeReviewBtnText}>Write Review</Text>
                </TouchableOpacity>
              )}
            </View>

            {reviews.length === 0 ? (
              <Text style={styles.emptyReviewText}>No reviews yet. Be the first to review!</Text>
            ) : (
              reviews.map((review) => (
                <View key={review._id} style={styles.reviewCard}>
                  <View style={styles.reviewHeaderRow}>
                    <View style={styles.reviewUser}>
                      <MaterialIcons name="account-circle" size={24} color="#BCAAA4" />
                      <Text style={styles.reviewUserName}>{review.user?.username || review.user?.name || 'User'}</Text>
                    </View>
                    <View style={styles.reviewScore}>
                      <MaterialIcons name="star" size={14} color="#F4C430" />
                      <Text style={styles.reviewScoreText}>{review.overallRating}/5</Text>
                    </View>
                  </View>
                  <Text style={styles.reviewBody}>{review.bodyText}</Text>
                  
                  <View style={styles.reviewActions}>
                    <Text style={styles.reviewDate}>
                      {new Date(review.createdAt).toLocaleDateString()}
                    </Text>
                    {user && (user._id || user.id) === review.user?._id ? (
                      <View style={{ flexDirection: 'row', gap: 12 }}>
                        <TouchableOpacity onPress={() => handleEditClick(review)}>
                          <Text style={styles.editReviewText}>Edit</Text>
                        </TouchableOpacity>
                        <TouchableOpacity onPress={() => handleDeleteReview(review._id)}>
                          <Text style={styles.deleteReviewText}>Delete</Text>
                        </TouchableOpacity>
                      </View>
                    ) : user && user.role === 'customer' ? (
                      <TouchableOpacity onPress={() => { setSelectedReviewId(review._id); setShowReportModal(true); }}>
                        <Text style={styles.reportReviewText}>Report</Text>
                      </TouchableOpacity>
                    ) : null}
                  </View>
                </View>
              ))
            )}
          </View>
`;

content = content.replace("        </View>\n      </ScrollView>", reviewsJsx + "\n        </View>\n      </ScrollView>");

// 6. Modals
const modals = `
      {/* Write Review Modal */}
      <Modal visible={showReviewModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Write a Review</Text>
            
            <Text style={styles.modalLabel}>Rating: {reviewRating}/5</Text>
            <View style={styles.ratingButtonsRow}>
              {[1,2,3,4,5].map(num => (
                <TouchableOpacity key={num} style={[styles.ratingBtn, reviewRating === num && styles.ratingBtnActive]} onPress={() => setReviewRating(num)}>
                  <Text style={[styles.ratingBtnText, reviewRating === num && styles.ratingBtnTextActive]}>{num}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={styles.modalLabel}>Your Review</Text>
            <TextInput
              style={styles.reviewInput}
              multiline
              numberOfLines={4}
              placeholder="What did you think about this movie?"
              value={reviewText}
              onChangeText={setReviewText}
            />

            <View style={styles.modalActions}>
              <TouchableOpacity style={styles.modalCancelBtn} onPress={() => setShowReviewModal(false)}>
                <Text style={styles.modalCancelBtnText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.modalSubmitBtn} onPress={handleSubmitReview}>
                <Text style={styles.modalSubmitBtnText}>Submit</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Report Modal */}
      <Modal visible={showReportModal} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Report Review</Text>
            
            <Text style={styles.modalLabel}>Reason for reporting:</Text>
            <TextInput
              style={styles.reviewInput}
              placeholder="e.g. Spam, Offensive language, Spoilers..."
              value={reportReason}
              onChangeText={setReportReason}
            />

            <View style={styles.modalActions}>
              <TouchableOpacity style={styles.modalCancelBtn} onPress={() => setShowReportModal(false)}>
                <Text style={styles.modalCancelBtnText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.modalSubmitBtn} onPress={handleSubmitReport}>
                <Text style={styles.modalSubmitBtnText}>Report</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
`;

content = content.replace("    </SafeAreaView>\n  );\n}", modals + "    </SafeAreaView>\n  );\n}");

// 7. Styles
const stylesText = `  reviewHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  writeReviewBtn: { backgroundColor: '#D35400', flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, gap: 4 },
  writeReviewBtnText: { color: '#FFF', fontSize: 12, fontWeight: '600' },
  emptyReviewText: { color: '#8D6E63', fontStyle: 'italic', fontSize: 13 },
  reviewCard: { backgroundColor: '#FFF', padding: 12, borderRadius: 10, marginBottom: 10, borderWidth: 1, borderColor: '#F5EBE6' },
  reviewHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  reviewUser: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  reviewUserName: { fontSize: 13, fontWeight: '700', color: '#2C1810' },
  reviewScore: { flexDirection: 'row', alignItems: 'center', gap: 2, backgroundColor: '#FFF8F0', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6 },
  reviewScoreText: { fontSize: 12, fontWeight: '700', color: '#D35400' },
  reviewBody: { fontSize: 13, color: '#5D4037', lineHeight: 20, marginBottom: 8 },
  reviewActions: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderTopWidth: 1, borderTopColor: '#F5EBE6', paddingTop: 8 },
  reviewDate: { fontSize: 11, color: '#BCAAA4' },
  deleteReviewText: { fontSize: 12, color: '#E74C3C', fontWeight: '600' },
  reportReviewText: { fontSize: 12, color: '#8D6E63', fontWeight: '600' },

  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', padding: 20 },
  modalContent: { backgroundColor: '#FFF', borderRadius: 16, padding: 20 },
  modalTitle: { fontSize: 18, fontWeight: '700', color: '#2C1810', marginBottom: 16, textAlign: 'center' },
  modalLabel: { fontSize: 14, fontWeight: '600', color: '#5D4037', marginBottom: 8, marginTop: 8 },
  ratingButtonsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 12 },
  ratingBtn: { width: 30, height: 30, borderRadius: 15, backgroundColor: '#F5EBE6', justifyContent: 'center', alignItems: 'center' },
  ratingBtnActive: { backgroundColor: '#D35400' },
  ratingBtnText: { color: '#8D6E63', fontSize: 12, fontWeight: '600' },
  ratingBtnTextActive: { color: '#FFF' },
  reviewInput: { backgroundColor: '#F9F5F2', borderRadius: 10, padding: 12, minHeight: 80, textAlignVertical: 'top', borderWidth: 1, borderColor: '#E8D5C4', marginBottom: 20 },
  modalActions: { flexDirection: 'row', gap: 12 },
  modalCancelBtn: { flex: 1, paddingVertical: 12, borderRadius: 10, backgroundColor: '#F5EBE6', alignItems: 'center' },
  modalCancelBtnText: { color: '#8D6E63', fontWeight: '700' },
  modalSubmitBtn: { flex: 1, paddingVertical: 12, borderRadius: 10, backgroundColor: '#D35400', alignItems: 'center' },
  modalSubmitBtnText: { color: '#FFF', fontWeight: '700' },
});`;

const lastIndex = content.lastIndexOf("});");
if (lastIndex !== -1) {
  content = content.substring(0, lastIndex) + stylesText + "\n" + content.substring(lastIndex + 3);
}

fs.writeFileSync(filePath, content);
console.log('Successfully updated movie-detail.jsx');
